import {
    OCR_CHANNEL,
    SingleFileCreatedEvent,
} from "event/orc.event.listener.service";
// src/service/file.service.ts
import { inject, injectable } from "inversify";
import { RedisClientType } from "redis";
import { Repository } from "typeorm";

import { CreateFileDTO } from "@/dto/file/create.file.js";
import { UpdateFileDTO } from "@/dto/file/update.file.js";
import { FileEntity, FileStatus, FileType } from "@/entity/file.js";
import { StudentEntity } from "@/entity/student.js";
import { TYPES } from "@/type/container/types.js";
import { AccessDeniedException } from "@/type/exception/access.denied.exception";
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
    public async createFile(
        createFileDTO: CreateFileDTO,
        userId: string,
    ): Promise<FileEntity> {
        // Verify student exists and load files
        const student: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: ["files"],
                where: { id: createFileDTO.studentId },
            });

        if (!student) {
            throw new EntityNotFoundException(
                `Student with ID ${createFileDTO.studentId} not found`,
            );
        }

        if (student.userId !== userId && student.userId !== undefined) {
            throw new AccessDeniedException("Access denied");
        }

        // Use the helper method from StudentEntity
        if (student.getActiveFiles().length >= 6) {
            throw new ValidationException({
                file:
                    `Student has reached the maximum limit of 6 files. ` +
                    `Current active files: ${student.getActiveFiles().length.toString()}`,
            });
        }

        const newFile: FileEntity = this.fileRepository.create(createFileDTO);
        const savedFile: FileEntity = await this.fileRepository.save(newFile);

        const payload: SingleFileCreatedEvent = {
            fileId: savedFile.id,
            studentId: savedFile.studentId,
            userId: userId,
        };

        await this.redisPublisher.publish(OCR_CHANNEL, JSON.stringify(payload));

        logger.info(
            `File created with ID: ${savedFile.id}. Published event to ${OCR_CHANNEL}.`,
        );
        return savedFile;
    }

    public async createFileAnonymously(
        createFileDTO: CreateFileDTO,
    ): Promise<FileEntity> {
        // Verify student exists and load files
        const student: null | StudentEntity =
            await this.studentRepository.findOne({
                relations: ["files"],
                where: { id: createFileDTO.studentId },
            });

        if (!student) {
            throw new EntityNotFoundException(
                `Student with ID ${createFileDTO.studentId} not found`,
            );
        }

        if (student.getActiveFiles().length >= 6) {
            throw new ValidationException({
                file:
                    `Student has reached the maximum limit of 6 files. ` +
                    `Current active files: ${student.getActiveFiles().length.toString()}`,
            });
        }

        const newFile: FileEntity = this.fileRepository.create(createFileDTO);
        const savedFile: FileEntity = await this.fileRepository.save(newFile);

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

    public async deleteFile(fileId: string): Promise<void> {
        const file = await this.getFileById(fileId);

        // Soft delete - mark as deleted instead of actually removing
        file.status = FileStatus.DELETED;
        await this.fileRepository.save(file);
        logger.info(`File soft deleted with ID: ${fileId}`);
    }

    public async getFileById(fileId: string): Promise<FileEntity> {
        const file = await this.fileRepository.findOne({
            relations: ["student"],
            where: { id: fileId, status: FileStatus.ACTIVE },
        });

        if (!file) {
            throw new EntityNotFoundException(
                `File with ID ${fileId} not found`,
            );
        }

        return file;
    }

    public async getFilesByStudentId(studentId: string): Promise<FileEntity[]> {
        return await this.fileRepository.find({
            order: { createdAt: "DESC" },
            where: {
                status: FileStatus.ACTIVE,
                studentId: studentId,
            },
        });
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
        updateFileDTO: UpdateFileDTO,
    ): Promise<FileEntity> {
        const file = await this.getFileById(fileId);

        // Handle each field explicitly, including null values for clearing
        if (
            updateFileDTO.description !== undefined &&
            updateFileDTO.description.trim() !== ""
        ) {
            file.description = updateFileDTO.description;
        }

        if (
            updateFileDTO.fileName !== undefined &&
            updateFileDTO.fileName.trim() !== ""
        ) {
            file.fileName = updateFileDTO.fileName;
        }

        if (
            updateFileDTO.fileType !== undefined &&
            updateFileDTO.fileType.trim() !== ""
        ) {
            file.fileType = updateFileDTO.fileType;
        }

        if (updateFileDTO.metadata !== undefined) {
            file.metadata = updateFileDTO.metadata;
        }

        if (
            updateFileDTO.tags !== undefined &&
            updateFileDTO.tags.trim() !== ""
        ) {
            file.tags = updateFileDTO.tags;
        }

        const updatedFile: FileEntity = await this.fileRepository.save(file);
        logger.info(`File updated successfully with ID: ${updatedFile.id}`);
        return updatedFile;
    }
}
