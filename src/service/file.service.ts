// src/service/file.service.ts
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";

import { CreateFileDTO } from "@/dto/file/create.file";
import { UpdateFileDTO } from "@/dto/file/update.file";
import { FileEntity, FileStatus, FileType } from "@/entity/file.js";
import { StudentEntity } from "@/entity/student.js";
import { TYPES } from "@/type/container/types.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception";
import logger from "@/util/logger.js";

@injectable()
export class FileService {
    constructor(
        @inject(TYPES.FileRepository)
        private fileRepository: Repository<FileEntity>,
        @inject(TYPES.StudentRepository)
        private studentRepository: Repository<StudentEntity>,
    ) {}

    async createFile(createFileDTO: CreateFileDTO): Promise<FileEntity> {
        // Verify student exists
        const student: null | StudentEntity =
            await this.studentRepository.findOne({
                where: { id: createFileDTO.studentId },
            });

        if (!student) {
            throw new EntityNotFoundException(
                `Student with ID ${createFileDTO.studentId} not found`,
            );
        }

        const fileEntity = this.fileRepository.create(createFileDTO);
        const savedFile = await this.fileRepository.save(fileEntity);

        logger.info(`File created successfully with ID: ${savedFile.id}`);
        return savedFile;
    }

    async deleteFile(fileId: string): Promise<void> {
        const file = await this.getFileById(fileId);

        // Soft delete - mark as deleted instead of actually removing
        file.status = FileStatus.DELETED;
        await this.fileRepository.save(file);
        logger.info(`File soft deleted with ID: ${fileId}`);
    }

    async getFileById(fileId: string): Promise<FileEntity> {
        const file = await this.fileRepository.findOne({
            relations: ["student", "uploader"],
            where: { id: fileId, status: FileStatus.ACTIVE },
        });

        if (!file) {
            throw new EntityNotFoundException(
                `File with ID ${fileId.toString()} not found`,
            );
        }

        return file;
    }

    async getFilesByStudentId(studentId: string): Promise<FileEntity[]> {
        return await this.fileRepository.find({
            order: { createdAt: "DESC" },
            relations: ["uploader"],
            where: {
                status: FileStatus.ACTIVE,
                studentId: studentId,
            },
        });
    }

    async getFilesByStudentIdAndType(
        studentId: string,
        fileType: FileType,
    ): Promise<FileEntity[]> {
        return await this.fileRepository.find({
            order: { createdAt: "DESC" },
            relations: ["uploader"],
            where: {
                fileType: fileType,
                status: FileStatus.ACTIVE,
                studentId: studentId,
            },
        });
    }

    async getStudentFilesWithCounts(studentId: string): Promise<{
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
            totalSize += Number(file.fileSize);
        });

        return { counts, files, totalSize };
    }

    async permanentlyDeleteFile(fileId: string): Promise<void> {
        const file = await this.getFileById(fileId);
        await this.fileRepository.remove(file);
        logger.info(`File permanently deleted with ID: ${fileId}`);
    }

    async updateFile(
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
