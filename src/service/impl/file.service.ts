import { inject, injectable } from "inversify";
import { EntityManager, IsNull, Repository } from "typeorm";
import { Logger } from "winston";

import { CreateFileDTO } from "@/dto/file/create-file.js";
import { UpdateFileRequest } from "@/dto/file/update-file.js";
import { FileEntity, FileStatus } from "@/entity/file.entity.js";
import { StudentEntity } from "@/entity/student.entity.js";
import {
    FileEventListener,
    FilesCreatedEvent,
    SingleFileCreatedEvent,
} from "@/event/file-event-listener.js";
import { IFileService } from "@/service/file-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { AccessDeniedException } from "@/type/exception/access-denied.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";

@injectable()
export class FileService implements IFileService {
    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.FileRepository)
        private readonly fileRepository: Repository<FileEntity>,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.FileEventListener)
        private readonly fileEventListener: FileEventListener,
    ) {}

    /**
     * Creates a single file and emits a SingleFileCreatedEvent.
     */
    public async createFile(
        createFileDTO: CreateFileDTO,
        userId?: string,
    ): Promise<FileEntity> {
        const savedFile = await this.studentRepository.manager.transaction(
            async (transactionalEntityManager) => {
                // Use the refactored helper for all validation and locking
                await this._getAndValidateStudentForUpload(
                    transactionalEntityManager,
                    createFileDTO.studentId,
                    1,
                    userId,
                );

                const newFile = this.fileRepository.create(createFileDTO);
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

        // Use transaction to handle pessimistic lock properly
        const savedFiles = await this.studentRepository.manager.transaction(
            async (transactionalEntityManager) => {
                // Use the helper for batch validation too.
                await this._getAndValidateStudentForUpload(
                    transactionalEntityManager,
                    studentId,
                    createFileDTOs.length, // Number of files being added
                    userId,
                );

                const newFiles = createFileDTOs.map((dto) =>
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

    public async getFileById(
        fileId: string,
        userId?: string,
    ): Promise<FileEntity> {
        const file = await this.fileRepository.findOne({
            relations: ["student"],
            where: {
                id: fileId,
                status: FileStatus.ACTIVE,
                userId: userId ?? IsNull(),
            },
        });

        if (!file) {
            throw new EntityNotFoundException(
                `File with ID ${fileId} not found`,
            );
        }

        return file;
    }

    public async getFilesByStudentId(
        studentId: string,
        userId?: string,
    ): Promise<FileEntity[]> {
        const files: FileEntity[] = await this.fileRepository.find({
            order: { createdAt: "DESC" },
            where: {
                status: FileStatus.ACTIVE,
                studentId: studentId,
                userId: userId ?? IsNull(),
            },
        });
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
            file.modifiedBy = userId;
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
        // 1. Lock the student row to prevent concurrent modifications.
        const student = await transactionalEntityManager.findOne(
            StudentEntity,
            {
                lock: { mode: "pessimistic_write" },
                where: { id: studentId, userId: userId ?? IsNull() },
            },
        );

        if (!student) {
            throw new EntityNotFoundException(
                `Student profile with ID ${studentId} not found`,
            );
        }

        // 2. Perform access control check if a userId is provided.
        if (userId && student.userId !== userId) {
            throw new AccessDeniedException("Access denied");
        }

        // 3. Efficiently count existing active files instead of loading them all.
        const currentActiveFiles = await transactionalEntityManager.count(
            FileEntity,
            {
                where: { status: FileStatus.ACTIVE, studentId: studentId },
            },
        );

        // 4. Validate the file limit.
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
}
