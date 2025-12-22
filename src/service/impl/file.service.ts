import { instanceToInstance } from "class-transformer";
import { inject, injectable } from "inversify";
import { EntityManager, IsNull, Repository } from "typeorm";
import { promisify } from "util";
import { Logger } from "winston";
import { gunzip, gzip, type ZlibOptions } from "zlib";

import type { IFileEventListener } from "@/event/file-event-listener.interface.js";
import type {
    FilesCreatedEvent,
    SingleFileCreatedEvent,
} from "@/event/file.event.js";
import type { IFileService } from "@/service/file-service.interface.js";

import { CreateFileDTO } from "@/dto/file/create-file.js";
import { UpdateFileRequest } from "@/dto/file/update-file.js";
import { FileEntity, FileStatus } from "@/entity/uni_guide/file.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TYPES } from "@/type/container/types.js";
import { AccessDeniedException } from "@/type/exception/access-denied.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

interface CompressionResult {
    [key: string]: unknown;
    content: Buffer;
    metadata: Metadata | undefined;
}
interface Metadata extends Partial<Record<string, unknown>> {
    compressionRatio?: string | undefined;
    isCompressed?: boolean | undefined;
    originalSize?: number | undefined;
}

@injectable()
export class FileService implements IFileService {
    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.FileRepository)
        private readonly fileRepository: Repository<FileEntity>,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.IFileEventListener)
        private readonly fileEventListener: IFileEventListener,
        @inject(TYPES.CompressionOptions)
        private readonly COMPRESSION_OPTIONS: ZlibOptions,
        @inject(TYPES.DecompressionOptions)
        private readonly DECOMPRESSION_OPTIONS: ZlibOptions,
        @inject(TYPES.IncompressibleMimeTypes)
        private readonly INCOMPRESSIBLE_MIME_TYPES: Set<string>,
    ) {}

    /**
     * Creates a single file and emits a SingleFileCreatedEvent.
     */
    public async createFile(
        createFileDTO: CreateFileDTO,
        userId?: string,
    ): Promise<FileEntity> {
        const { content, metadata } =
            await this.compressFileIfBeneficial(createFileDTO);

        const dtoWithCompression: CreateFileDTO =
            instanceToInstance(createFileDTO);
        dtoWithCompression.fileContent = content;
        dtoWithCompression.fileSize = content.length;
        dtoWithCompression.metadata = metadata;

        const savedFile = await this.studentRepository.manager.transaction(
            async (transactionalEntityManager) => {
                await this._getAndValidateStudentForUpload(
                    transactionalEntityManager,
                    dtoWithCompression.studentId,
                    1,
                    userId,
                );

                const newFile = this.fileRepository.create(dtoWithCompression);
                return await transactionalEntityManager.save(
                    FileEntity,
                    newFile,
                );
            },
        );

        this._publishFileCreatedEvent({
            fileId: savedFile.id,
            studentId: savedFile.studentId,
            userId: userId,
        });

        return savedFile;
    }

    /**
     * Creates a batch of files and emits a FilesCreatedEvent.
     */
    public async createFiles(
        createFileDTOs: CreateFileDTO[],
        studentId: string,
        userId?: string,
    ): Promise<FileEntity[]> {
        if (createFileDTOs.length === 0) {
            return [];
        }

        // Validate all DTOs have the same studentId
        for (let i = 0; i < createFileDTOs.length; i++) {
            const dto = createFileDTOs[i];
            if (dto.studentId !== studentId) {
                throw new ValidationException({
                    studentId: `All files must be for the same student. Expected studentId: ${studentId}, but file at index ${i.toString()} has studentId: ${dto.studentId}`,
                });
            }
        }

        // Process all files with conditional compression
        const compressedDTOs = await Promise.all(
            createFileDTOs.map(async (dto) => {
                const { content, metadata } =
                    await this.compressFileIfBeneficial(dto);

                const clonedDto = instanceToInstance(dto);
                clonedDto.fileContent = content;
                clonedDto.fileSize = content.length; // Update to actual storage size
                clonedDto.metadata = metadata;

                return clonedDto;
            }),
        );

        const savedFiles = await this.studentRepository.manager.transaction(
            async (transactionalEntityManager) => {
                await this._getAndValidateStudentForUpload(
                    transactionalEntityManager,
                    studentId,
                    compressedDTOs.length,
                    userId,
                );

                const newFiles = compressedDTOs.map((dto) =>
                    this.fileRepository.create(dto),
                );
                return await transactionalEntityManager.save(
                    FileEntity,
                    newFiles,
                );
            },
        );

        if (savedFiles.length > 0) {
            this._publishFilesCreatedEvent({
                fileIds: savedFiles.map((file) => file.id),
                studentId: studentId,
                userId: userId,
            });
        }

        return savedFiles;
    }

    public async deleteFile(fileId: string, userId?: string): Promise<void> {
        const file = await this.getFileById(fileId, userId);

        file.status = FileStatus.DELETED;
        await this.fileRepository.save(file);
        this.logger.info(`File soft deleted with ID: ${fileId}`);
    }

    /**
     * Gets file by ID and decompresses content if needed
     */
    public async getFileById(
        fileId: string,
        userId?: string,
    ): Promise<FileEntity> {
        const query = this.fileRepository
            .createQueryBuilder("files")
            .leftJoinAndSelect("files.student", "student")
            .addSelect("files.fileContent")
            .where("files.id = :fileId", { fileId })
            .andWhere("files.status = :status", { status: FileStatus.ACTIVE });

        if (userId) {
            query.andWhere("student.userId = :userId", { userId });
        } else {
            query.andWhere("student.userId IS NULL");
        }

        const file = await query.getOne();

        if (!file) {
            throw new EntityNotFoundException(
                `File with ID ${fileId} not found`,
            );
        }

        if (file.metadata?.isCompressed) {
            try {
                file.fileContent = await gunzipAsync(
                    file.fileContent,
                    this.DECOMPRESSION_OPTIONS,
                );
            } catch (error) {
                this.logger.error(`Failed to decompress file ${fileId}`, {
                    error,
                });
                throw new Error("Failed to decompress file content");
            }
        }

        return file;
    }

    /**
     * Gets files by student ID and decompresses content if needed
     */
    public async getFilesMetadataByStudentId(
        studentId: string,
        userId?: string,
    ): Promise<FileEntity[]> {
        const query = this.fileRepository
            .createQueryBuilder("files")
            .leftJoinAndSelect("files.student", "student")
            .select(["files", "student.id", "student.userId"])
            .where("files.status = :status", { status: FileStatus.ACTIVE })
            .andWhere("files.studentId = :studentId", { studentId: studentId });

        if (userId) {
            query.andWhere("student.userId = :userId", { userId });
        } else {
            query.andWhere("student.userId IS NULL");
        }

        const files: FileEntity[] = await query
            .orderBy("files.createdAt", "DESC")
            .getMany();

        if (files.length === 0) {
            throw new EntityNotFoundException(
                `Files not found for student with ID: ${studentId}`,
            );
        }

        return files;
    }

    public async updateFile(
        fileId: string,
        updateFileDTO: UpdateFileRequest,
        userId?: string,
    ): Promise<FileEntity> {
        const file = await this.getFileById(fileId, userId);

        const hasChanges = this.applyUpdatesAndDetectChanges(
            file,
            updateFileDTO,
        );

        if (hasChanges && userId) {
            file.updatedBy = userId;
            const updatedFile: FileEntity =
                await this.fileRepository.save(file);
            this.logger.info(
                `File updated successfully with ID: ${updatedFile.id}`,
            );
            return updatedFile;
        }

        this.logger.info(`No changes detected for file ID: ${file.id}`);
        return file;
    }

    /**
     * A private helper to find, lock, and validate a student within a transaction.
     * This improves performance by using a COUNT query instead of loading all file relations.
     */
    private async _getAndValidateStudentForUpload(
        transactionalEntityManager: EntityManager,
        studentId: string,
        filesToAdd: number,
        userId?: string,
    ): Promise<void> {
        const student = await transactionalEntityManager.findOne(
            StudentEntity,
            {
                lock: { mode: "pessimistic_write" },
                transaction: true,
                where: { id: studentId, userId: userId ?? IsNull() },
            },
        );

        if (!student) {
            throw new EntityNotFoundException(
                `Student profile with ID ${studentId} not found`,
            );
        }

        if (userId && student.userId !== userId) {
            throw new AccessDeniedException("Access denied");
        }

        const currentActiveFiles = await transactionalEntityManager.count(
            FileEntity,
            {
                where: { status: FileStatus.ACTIVE, studentId: studentId },
            },
        );

        if (currentActiveFiles + filesToAdd > 6) {
            throw new ValidationException({
                files:
                    `Adding ${filesToAdd.toString()} file(s) would exceed the maximum limit of 6. ` +
                    `Student currently has ${currentActiveFiles.toString()} active file(s).`,
            });
        }
    }

    private _publishFileCreatedEvent(event: SingleFileCreatedEvent): void {
        this.fileEventListener
            .handleFileCreatedEvent(event)
            .catch((error: unknown) => {
                this.logger.error(
                    "Failed to handle file created event in background",
                    {
                        error,
                        event,
                    },
                );
            });

        this.logger.info(
            `Triggered OCR event for file ${event.fileId} of student ${event.studentId}`,
        );
    }

    private _publishFilesCreatedEvent(event: FilesCreatedEvent): void {
        this.fileEventListener
            .handleFileCreatedEvent(event)
            .catch((error: unknown) => {
                this.logger.error(
                    "Failed to handle files created event in background",
                    {
                        error,
                        event,
                    },
                );
            });

        this.logger.info(
            `Triggered OCR batch event for ${event.fileIds.length.toString()} files of student ${event.studentId}`,
        );
    }

    private applyUpdatesAndDetectChanges(
        file: FileEntity,
        updateFileDTO: UpdateFileRequest,
    ): boolean {
        let hasChanges = false;

        if (
            updateFileDTO.description !== undefined &&
            updateFileDTO.description.trim() !== "" &&
            file.description !== updateFileDTO.description
        ) {
            file.description = updateFileDTO.description;
            hasChanges = true;
        }

        if (
            updateFileDTO.fileName !== undefined &&
            updateFileDTO.fileName.trim() !== "" &&
            file.fileName !== updateFileDTO.fileName
        ) {
            file.fileName = updateFileDTO.fileName;
            hasChanges = true;
        }

        if (
            updateFileDTO.fileType !== undefined &&
            updateFileDTO.fileType.trim() !== "" &&
            file.fileType !== updateFileDTO.fileType
        ) {
            file.fileType = updateFileDTO.fileType;
            hasChanges = true;
        }

        if (
            updateFileDTO.metadata !== undefined &&
            JSON.stringify(file.metadata) !==
                JSON.stringify(updateFileDTO.metadata)
        ) {
            file.metadata = updateFileDTO.metadata;
            hasChanges = true;
        }

        if (
            updateFileDTO.tags !== undefined &&
            updateFileDTO.tags.trim() !== "" &&
            file.tags !== updateFileDTO.tags
        ) {
            file.tags = updateFileDTO.tags;
            hasChanges = true;
        }

        return hasChanges;
    }

    /**
     * Compresses a file if it's beneficial (reduces size)
     * Returns the content, updated metadata, and actual storage size
     */
    private async compressFileIfBeneficial(
        dto: CreateFileDTO,
    ): Promise<CompressionResult> {
        if (!this.isCompressible(dto.mimeType)) {
            this.logger.info(
                `Compression skipped for ${dto.originalFileName}: format already compressed (${dto.mimeType})`,
            );
            return {
                content: dto.fileContent,
                metadata: dto.metadata,
            };
        }

        const compressedContent = await gzipAsync(
            dto.fileContent,
            this.COMPRESSION_OPTIONS,
        );

        const originalSize = dto.fileSize;
        const compressedSize = compressedContent.length;

        // Only use compression if it actually reduces size
        if (compressedSize >= originalSize) {
            this.logger.info(
                `Compression skipped for ${dto.originalFileName}: would increase size`,
            );
            return {
                content: dto.fileContent,
                metadata: dto.metadata,
            };
        }

        const compressionRatio = (
            (1 - compressedSize / originalSize) *
            100
        ).toFixed(2);

        this.logger.info(
            `File compressed: ${originalSize.toString()} bytes → ${compressedSize.toString()} bytes (${compressionRatio}% reduction)`,
        );

        return {
            content: compressedContent,
            metadata: {
                ...(dto.metadata ?? {}),
                compressionRatio,
                isCompressed: true,
                originalSize,
            },
        };
    }

    /**
     * Determines if a file should be compressed based on its MIME type
     */
    private isCompressible(mimeType: string): boolean {
        return !this.INCOMPRESSIBLE_MIME_TYPES.has(mimeType);
    }
}
