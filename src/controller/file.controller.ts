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

        const response = request.res;

        // Sanitize filename for security
        const sanitizedFileName = this.sanitizeFilename(file.fileName);

        // Set security and download headers
        this.setDownloadHeaders(
            response,
            file.mimeType,
            sanitizedFileName,
            file.fileContent.length,
        );

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

        const response = request.res;

        // Sanitize filename for security
        const sanitizedFileName = this.sanitizeFilename(file.fileName);

        // Set preview headers with caching
        this.setPreviewHeaders(
            response,
            file.mimeType,
            sanitizedFileName,
            file.fileContent.length,
        );

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
        // Validate string fields using helper method
        this.validateStringFields({
            description: updateFileDTO.description,
            fileName: updateFileDTO.fileName,
            tags: updateFileDTO.tags,
        });

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

        // Validate string fields using helper method
        this.validateStringFields({
            description,
            fileName,
            tags,
        });

        // Validate filenames for security (block dangerous patterns)
        this.validateFilename(fileName ?? file.originalname, user);
        this.validateFilename(file.originalname, user);

        // Use original filenames since they passed validation
        const finalFileName = fileName ?? file.originalname;

        // Validate file extension for security
        this.validateFileExtension(finalFileName, file.mimetype);

        const createFileDTO: CreateFileDTO = {
            description: description,
            fileContent: file.buffer,
            fileName: finalFileName,
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

    // Private helper methods

    /**
     * Sanitize filename to prevent directory traversal and special characters
     * (Keep this for download sanitization only)
     */
    private sanitizeFilename(filename: string): string {
        return filename
            .split("") // Split into characters
            .map((char) => {
                const code = char.charCodeAt(0);
                // Replace control characters (0-31, 127-159) and invalid filesystem chars
                if (
                    code < 32 ||
                    (code >= 127 && code < 160) ||
                    /[<>:"/\\|?*]/.test(char)
                ) {
                    return "_";
                }
                return char;
            })
            .join("")
            .replace(/^\.+/, "") // Remove leading dots
            .replace(/\.+$/, "") // Remove trailing dots
            .trim() // Remove leading/trailing whitespace
            .substring(0, 255); // Limit length
    }

    /**
     * Set headers for file downloads with security measures
     */
    private setDownloadHeaders(
        response: express.Response,
        mimeType: string,
        filename: string,
        contentLength: number,
    ): void {
        // Content headers
        response.setHeader("Content-Type", mimeType);
        response.setHeader("Content-Length", contentLength.toString());
        response.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`,
        );

        // Security headers for downloads
        response.setHeader(
            "Cache-Control",
            "no-cache, no-store, must-revalidate",
        );
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");

        // Additional security
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Content-Security-Policy", "default-src 'none'");
    }

    /**
     * Set headers for file previews with appropriate caching
     */
    private setPreviewHeaders(
        response: express.Response,
        mimeType: string,
        filename: string,
        contentLength: number,
    ): void {
        // Content headers
        response.setHeader("Content-Type", mimeType);
        response.setHeader("Content-Length", contentLength.toString());
        response.setHeader(
            "Content-Disposition",
            `inline; filename="${filename}"`,
        );

        // Caching for previews (images can be cached)
        response.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache
        response.setHeader("ETag", `"${filename}-${contentLength.toString()}"`);

        // Security headers
        response.setHeader("X-Content-Type-Options", "nosniff");
    }

    /**
     * Validate file extension against MIME type for security
     */
    private validateFileExtension(filename: string, mimeType: string): void {
        const extension = filename.toLowerCase().split(".").pop();

        // Common dangerous extensions that should be blocked
        const dangerousExtensions = [
            "exe",
            "bat",
            "cmd",
            "com",
            "pif",
            "scr",
            "vbs",
            "js",
            "jar",
            "sh",
            "php",
            "asp",
            "aspx",
            "jsp",
            "py",
            "rb",
            "pl",
        ];

        if (extension && dangerousExtensions.includes(extension)) {
            throw new ValidationException({
                fileName: `File extension '.${extension}' is not allowed for security reasons`,
            });
        }

        // Optional: Validate that extension matches MIME type
        const mimeToExtension: Record<string, string[]> = {
            "application/msword": ["doc"],
            "application/pdf": ["pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                ["docx"],
            "image/gif": ["gif"],
            "image/jpeg": ["jpg", "jpeg"],
            "image/png": ["png"],
            "text/plain": ["txt"],
        };

        const expectedExtensions = mimeToExtension[mimeType];
        if (extension && !expectedExtensions.includes(extension)) {
            this.logger.warn(
                `MIME type '${mimeType}' doesn't match extension '.${extension}'`,
                {
                    extension,
                    filename,
                    mimeType,
                },
            );
        }
    }

    /**
     * Validate filename for dangerous patterns and block them
     */
    private validateFilename(filename: string, user: Express.User): void {
        // Check for control characters
        for (let i = 0; i < filename.length; i++) {
            const code = filename.charCodeAt(i);
            if (code < 32 || (code >= 127 && code < 160)) {
                throw new ValidationException({
                    fileName: `Filename contains invalid control characters. Character code: ${code.toString()} at position ${i.toString()}`,
                });
            }
        }

        // Check for invalid filesystem characters
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(filename)) {
            const match = invalidChars.exec(filename);
            if (match) {
                // match[0] is guaranteed to exist since we're inside the if block
                throw new ValidationException({
                    fileName: `Filename contains invalid character: '${match[0]}'...`,
                });
            }
        }

        // Check for directory traversal patterns
        if (
            filename.includes("..") ||
            filename.includes("./") ||
            filename.includes(".\\")
        ) {
            throw new ValidationException({
                fileName:
                    "Filename cannot contain directory traversal patterns (.. ./ .\\)",
            });
        }

        // Check for leading/trailing dots or spaces
        if (/^\.+/.test(filename) || /\.+$/.test(filename)) {
            throw new ValidationException({
                fileName: "Filename cannot start or end with dots",
            });
        }

        if (filename.trim() !== filename) {
            throw new ValidationException({
                fileName: "Filename cannot have leading or trailing whitespace",
            });
        }

        // Check filename length
        if (filename.length === 0) {
            throw new ValidationException({
                fileName: "Filename cannot be empty",
            });
        }

        if (filename.length > 255) {
            throw new ValidationException({
                fileName: `Filename too long. Maximum 255 characters, got ${filename.length.toString()}`,
            });
        }

        // Check for Windows reserved names
        const windowsReserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
        if (windowsReserved.test(filename)) {
            throw new ValidationException({
                fileName: `Filename '${filename}' is a reserved Windows system name`,
            });
        }

        // Log suspicious patterns for security monitoring
        const suspiciousPatterns = [
            /\.(exe|bat|cmd|com|pif|scr|vbs|jar)$/i,
            /script/i,
            /%[0-9a-f]{2}/i, // URL encoded characters
            /\\x[0-9a-f]{2}/i, // Hex encoded characters
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(filename)) {
                this.logger.warn("Suspicious filename pattern detected", {
                    filename,
                    pattern: pattern.toString(),
                    userId: user.id,
                });
            }
        }
    }

    /**
     * Validate string fields to ensure they're not empty strings
     */
    private validateStringFields(
        fields: Record<string, string | undefined>,
    ): void {
        for (const [fieldName, value] of Object.entries(fields)) {
            if (value !== undefined && value.trim() === "") {
                throw new ValidationException({
                    [fieldName]: `${fieldName} cannot be an empty string`,
                });
            }
        }
    }
}
