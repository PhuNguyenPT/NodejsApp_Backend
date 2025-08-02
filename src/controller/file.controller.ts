// src/controller/file.controller.ts
import express from "express";
import { inject, injectable } from "inversify";
import {
    Body,
    Controller,
    Delete,
    FormField,
    Get,
    Middlewares,
    Path,
    Post,
    Produces,
    Put,
    Request,
    Response,
    Route,
    Security,
    SuccessResponse,
    Tags,
    UploadedFile,
} from "tsoa";

import { CreateFileDTO } from "@/dto/file/create.file";
import { FileResponse, FileUploadResponse } from "@/dto/file/file.response.js";
import { UpdateFileDTO } from "@/dto/file/update.file";
import { FileEntity, FileType } from "@/entity/file.js";
import { FileMapper } from "@/mapper/file.mapper";
import { validateUuidParam } from "@/middleware/uuid.validation.middleware";
import validateDTO from "@/middleware/validation.middleware";
import { FileService } from "@/service/file.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http.status.js";
import { ValidationException } from "@/type/exception/validation.exception";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { ILogger } from "@/type/interface/logger";

@injectable()
@Route("files")
@Tags("Files")
export class FileController extends Controller {
    constructor(
        @inject(TYPES.FileService)
        private fileService: FileService,
        @inject(TYPES.Logger)
        private logger: ILogger,
    ) {
        super();
    }

    /**
     * Delete file (soft delete)
     */
    @Delete("{fileId}")
    @Middlewares(validateUuidParam("fileId"))
    @Security("bearerAuth", ["file:delete"])
    @SuccessResponse(HttpStatus.NO_CONTENT, "File deleted successfully")
    public async deleteFile(@Path() fileId: string): Promise<void> {
        await this.fileService.deleteFile(fileId);
    }

    /**
     * Download file content
     * @summary Download a file
     * @returns Binary file content
     */
    @Get("{fileId}/download")
    @Middlewares(validateUuidParam("fileId"))
    @Produces("application/octet-stream")
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "File downloaded successfully", "file")
    public async downloadFile(
        @Path() fileId: string,
        @Request() request: express.Request,
    ): Promise<void> {
        const file: FileEntity = await this.fileService.getFileById(fileId);

        // Log buffer info for debugging
        this.logger.info(
            `File download - Size: ${file.fileSize.toString()}, Buffer length: ${file.fileContent.length.toString()}, MIME: ${file.mimeType}`,
        );

        // Verify buffer is valid
        if (file.fileContent.length === 0) {
            throw new ValidationException({
                file: "File content is empty or corrupted",
            });
        }
        // Check if response object exists
        if (!request.res) {
            throw new Error("Response object not available");
        }

        // Get response object from request
        const response = request.res;

        // Set headers directly on response object to bypass middleware
        response.setHeader("Content-Type", file.mimeType); // Pure MIME type, no charset
        response.setHeader(
            "Content-Disposition",
            `attachment; filename="${file.fileName}"`,
        );
        response.setHeader(
            "Content-Length",
            file.fileContent.length.toString(),
        );
        response.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate",
        );
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");

        // Log what we're actually setting
        this.logger.info("Response headers set:", {
            "Content-Disposition": response.getHeader("Content-Disposition"),
            "Content-Length": response.getHeader("Content-Length"),
            "Content-Type": response.getHeader("Content-Type"),
        });

        // Send binary data directly and end the response
        response.end(file.fileContent);

        this.logger.info("File download completed successfully", {
            bytesSent: file.getHumanReadableFileSize(),
            fileId,
        });
    }

    /**
     * Get file by ID
     */
    @Get("{fileId}")
    @Middlewares(validateUuidParam("fileId"))
    @Produces("application/json")
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "File retrieved successfully")
    public async getFileById(@Path() fileId: string): Promise<FileResponse> {
        const file: FileEntity = await this.fileService.getFileById(fileId);
        return FileMapper.toFileResponse(file);
    }

    /**
     * Get all files for a student
     */
    @Get("student/{studentId}")
    @Middlewares(validateUuidParam("studentId"))
    @Produces("application/json")
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "Files retrieved successfully")
    public async getFilesByStudentId(
        @Path() studentId: string,
    ): Promise<FileResponse[]> {
        const files: FileEntity[] =
            await this.fileService.getFilesByStudentId(studentId);
        return FileMapper.toFileResponseList(files);
    }

    /**
     * Get file preview (for images)
     * @summary Preview an image file
     * @returns Binary image content
     */
    @Get("{fileId}/preview")
    @Middlewares(validateUuidParam("fileId"))
    @Produces("image/*")
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "Image preview retrieved successfully")
    public async previewFile(
        @Path() fileId: string,
        @Request() request: express.Request,
    ): Promise<void> {
        const file: FileEntity = await this.fileService.getFileById(fileId);

        if (!file.isImage()) {
            throw new ValidationException({ fileType: "File is not an image" });
        }

        // Check if response object exists
        if (!request.res) {
            throw new Error("Response object not available");
        }

        // Get response object from request
        const response = request.res;

        // Set headers directly on response object to bypass middleware
        response.setHeader("Content-Type", file.mimeType); // Pure MIME type, no charset
        response.setHeader(
            "Content-Disposition",
            `inline; filename="${file.fileName}"`,
        );
        response.setHeader(
            "Content-Length",
            file.fileContent.length.toString(),
        );

        // Log what we're actually setting
        this.logger.info("Preview headers set:", {
            "Cache-Control": response.getHeader("Cache-Control"),
            "Content-Disposition": response.getHeader("Content-Disposition"),
            "Content-Length": response.getHeader("Content-Length"),
            "Content-Type": response.getHeader("Content-Type"),
        });

        // Send binary data directly and end the response
        response.end(file.fileContent);

        this.logger.info("File preview completed successfully", {
            bytesSent: file.getHumanReadableFileSize(),
            fileId,
        });
    }
    /**
     * Update file metadata
     */
    @Middlewares(validateUuidParam("fileId"), validateDTO(UpdateFileDTO))
    @Produces("application/json")
    @Put("{fileId}")
    @Security("bearerAuth", ["file:update"])
    @SuccessResponse(HttpStatus.OK, "File updated successfully")
    public async updateFile(
        @Path() fileId: string,
        @Body() updateFileDTO: UpdateFileDTO,
    ): Promise<FileResponse> {
        if (
            updateFileDTO.fileName !== undefined &&
            updateFileDTO.fileName.trim() === ""
        ) {
            throw new ValidationException({
                fileName: "fileName cannot be an empty string",
            });
        }
        if (
            updateFileDTO.description !== undefined &&
            updateFileDTO.description.trim() === ""
        ) {
            throw new ValidationException({
                description: "description cannot be an empty string",
            });
        }
        if (
            updateFileDTO.tags !== undefined &&
            updateFileDTO.tags.trim() === ""
        ) {
            throw new ValidationException({
                tags: "tags cannot be an empty string",
            });
        }

        const file: FileEntity = await this.fileService.updateFile(
            fileId,
            updateFileDTO,
        );
        return FileMapper.toFileResponse(file);
    }

    /**
     * Upload a file for a student
     */
    @Middlewares(validateUuidParam("studentId"))
    @Post("upload/{studentId}")
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Validation error")
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth", ["file:create"])
    @SuccessResponse(HttpStatus.CREATED, "File uploaded successfully")
    public async uploadFile(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
        @UploadedFile("file") file: Express.Multer.File,
        /**
         * File type - must be one of: certificate, document, image, other, portfolio, resume, transcript
         * @example "document"
         */
        @FormField("fileType") fileType: FileType,
        @FormField("fileName") fileName?: string,
        /**
         * Optional description of the file
         * @example "Student transcript for semester 1"
         */
        @FormField("description") description?: string,
        /**
         * Optional comma-separated tags
         * @example "academic,transcript,2024"
         */
        @FormField("tags") tags?: string,
    ): Promise<FileUploadResponse> {
        const user = request.user;
        if (fileName !== undefined && fileName.trim() === "") {
            throw new ValidationException({
                fileName: "fileName cannot be an empty string",
            });
        }
        if (description !== undefined && description.trim() === "") {
            throw new ValidationException({
                description: "description cannot be an empty string",
            });
        }
        if (tags !== undefined && tags.trim() === "") {
            throw new ValidationException({
                tags: "tags cannot be an empty string",
            });
        }
        const createFileDTO: CreateFileDTO = {
            description: description,
            fileContent: file.buffer,
            fileName: fileName ?? file.originalname,
            filePath: file.path,
            fileSize: file.size,
            fileType: fileType,
            mimeType: file.mimetype,
            originalFileName: file.originalname,
            studentId: studentId,
            tags: tags,
            uploadedBy: user.id,
        };

        const fileEntity: FileEntity =
            await this.fileService.createFile(createFileDTO);

        return {
            fileName: fileEntity.fileName,
            filePath: fileEntity.filePath,
            fileSize: fileEntity.getHumanReadableFileSize(),
            fileType: fileEntity.fileType,
            id: fileEntity.id,
            message: "File uploaded successfully",
            originalFileName: fileEntity.originalFileName,
        };
    }
}
