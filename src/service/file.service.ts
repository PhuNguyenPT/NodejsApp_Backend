import { inject, injectable } from "inversify";
import { RedisClientType } from "redis";
import { EntityManager, IsNull, Repository } from "typeorm";

import { CreateFileDTO } from "@/dto/file/create.file.js";
import { UpdateFileRequest } from "@/dto/file/update.file.js";
import { FileEntity, FileStatus, FileType } from "@/entity/file.js";
import { StudentEntity } from "@/entity/student.js";
import {
    FilesCreatedEvent,
    OCR_CHANNEL,
    SingleFileCreatedEvent,
} from "@/event/orc.event.listener.service.js";
import { TYPES } from "@/type/container/types.js";
import { AccessDeniedException } from "@/type/exception/access.denied.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import logger from "@/util/logger.js";

@injectable()
export class FileService {
    constructor(
        @inject(TYPES.FileRepository)
        private fileRepository: Repository<FileEntity>,
        @inject(TYPES.StudentRepository)
        private studentRepository: Repository<StudentEntity>,
        @inject(TYPES.RedisPublisher) private redisPublisher: RedisClientType,
    ) {}

    /**
     * Creates a single file and emits a SingleFileCreatedEvent.
     */
    public async createFile(
        createFileDTO: CreateFileDTO,
        userId: string,
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

        // Publish event after commit
        const payload: SingleFileCreatedEvent = {
            fileId: savedFile.id,
            studentId: savedFile.studentId,
            userId: userId,
        };
        await this.redisPublisher.publish(OCR_CHANNEL, JSON.stringify(payload));
        logger.info(
            `Created 1 file. Published single event to ${OCR_CHANNEL}. File ID: ${savedFile.id}`,
        );

        return savedFile;
    }

    /**
     * Creates a single file for guset and emits a SingleFileCreatedEvent.
     */
    public async createFileAnonymously(
        createFileDTO: CreateFileDTO,
    ): Promise<FileEntity> {
        const savedFile = await this.studentRepository.manager.transaction(
            async (transactionalEntityManager) => {
                // The same helper works for anonymous uploads by omitting the userId.
                await this._getAndValidateStudentForUpload(
                    transactionalEntityManager,
                    createFileDTO.studentId,
                    1, // Adding 1 file
                );

                const newFile = this.fileRepository.create(createFileDTO);
                return await transactionalEntityManager.save(
                    FileEntity,
                    newFile,
                );
            },
        );

        const payload: SingleFileCreatedEvent = {
            fileId: savedFile.id,
            studentId: savedFile.studentId,
        };
        await this.redisPublisher.publish(OCR_CHANNEL, JSON.stringify(payload));
        logger.info(
            `File created with ID: ${savedFile.id}. Published event to ${OCR_CHANNEL}.`,
        );

        return savedFile;
    }

    /**
     * Creates a batch of files and emits a single FilesCreatedEvent.
     */
    public async createFiles(
        createFileDTOs: CreateFileDTO[],
        userId: string,
        studentId: string,
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
            const payload: FilesCreatedEvent = {
                fileIds: savedFiles.map((file) => file.id),
                studentId: studentId,
                userId: userId,
            };
            await this.redisPublisher.publish(
                OCR_CHANNEL,
                JSON.stringify(payload),
            );
            logger.info(
                `Created ${savedFiles.length.toString()} files. Published batch event to ${OCR_CHANNEL}.`,
            );
        }
        return savedFiles;
    }

    /**
     * Creates a batch of files for guest and emits a single FilesCreatedEvent.
     */
    public async createFilesAnonymously(
        createFileDTOs: CreateFileDTO[],
        studentId: string,
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
            const payload: FilesCreatedEvent = {
                fileIds: savedFiles.map((file) => file.id),
                studentId: studentId,
            };
            await this.redisPublisher.publish(
                OCR_CHANNEL,
                JSON.stringify(payload),
            );
            logger.info(
                `Created ${savedFiles.length.toString()} files. Published batch event to ${OCR_CHANNEL}.`,
            );
        }
        return savedFiles;
    }

    public async deleteFile(fileId: string, userId?: string): Promise<void> {
        const file = await this.getFileById(fileId, userId);

        file.status = FileStatus.DELETED;
        await this.fileRepository.save(file);
        logger.info(`File soft deleted with ID: ${fileId}`);
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

    public async getFilesByStudentIdAndType(
        studentId: string,
        fileType: FileType,
    ): Promise<FileEntity[]> {
        return await this.fileRepository.find({
            order: { createdAt: "DESC" },
            where: {
                fileType: fileType,
                status: FileStatus.ACTIVE,
                studentId: studentId,
            },
        });
    }

    public async getStudentFilesWithCounts(studentId: string): Promise<{
        counts: Record<FileType, number>;
        files: FileEntity[];
        totalSize: number;
    }> {
        const files = await this.getFilesByStudentId(studentId);

        const counts = Object.values(FileType).reduce(
            (acc, type) => {
                acc[type] = 0;
                return acc;
            },
            {} as Record<FileType, number>,
        );

        let totalSize = 0;

        files.forEach((file) => {
            counts[file.fileType]++;
            totalSize += file.fileSize;
        });

        return { counts, files, totalSize };
    }

    public async permanentlyDeleteFile(fileId: string): Promise<void> {
        const file = await this.getFileById(fileId);
        await this.fileRepository.remove(file);
        logger.info(`File permanently deleted with ID: ${fileId}`);
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
            logger.info(`File updated successfully with ID: ${updatedFile.id}`);
            return updatedFile;
        }

        logger.info(`No changes detected for file ID: ${file.id}`);
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
        userId?: string, // userId is optional for anonymous uploads
    ): Promise<void> {
        // 1. Lock the student row to prevent concurrent modifications.
        const student = await transactionalEntityManager.findOne(
            StudentEntity,
            {
                lock: { mode: "pessimistic_write" },
                where: { id: studentId },
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
