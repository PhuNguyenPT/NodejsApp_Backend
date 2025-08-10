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
import { FileResponse } from "@/dto/file/file.response.js";
import { UpdateFileDTO } from "@/dto/file/update.file.js";
import { FileEntity, FileType } from "@/entity/file.js";
import { FileMapper } from "@/mapper/file.mapper.js";
import { validateUuidParam } from "@/middleware/uuid.validation.middleware.js";
import validateDTO from "@/middleware/validation.middleware.js";
import { FileService } from "@/service/file.service.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http.status.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { ILogger } from "@/type/interface/logger.js";

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
     * @summary Delete a file
     * @param fileId UUID of the file to delete
     * @returns No content on successful deletion
     */
    @Delete("{fileId}")
    @Middlewares(validateUuidParam("fileId"))
    @Response(HttpStatus.BAD_REQUEST, "Invalid file ID format")
    @Response(HttpStatus.NOT_FOUND, "File not found")
    @Response(HttpStatus.FORBIDDEN, "Insufficient permissions")
    @Response(HttpStatus.UNAUTHORIZED, "Unauthorized")
    @Security("bearerAuth", ["file:delete"])
    @SuccessResponse(HttpStatus.NO_CONTENT, "File deleted successfully")
    public async deleteFile(@Path() fileId: string): Promise<void> {
        await this.fileService.deleteFile(fileId);
    }

    /**
     * Download file content
     * @summary Download a file as attachment
     * @param fileId UUID of the file to download
     * @returns Binary file content with secure headers
     * @description Downloads the file with appropriate security headers including:
     * - Content-Disposition: attachment (forces download)
     * - Content-Security-Policy: default-src 'none' (prevents script execution)
     * - Cache-Control: no-cache (prevents caching of sensitive files)
     * - X-Content-Type-Options: nosniff (prevents MIME sniffing attacks)
     */
    @Get("{fileId}/download")
    @Middlewares(validateUuidParam("fileId"))
    @Produces("application/octet-stream")
    @Response(HttpStatus.BAD_REQUEST, "Invalid file ID or corrupted file")
    @Response(HttpStatus.NOT_FOUND, "File not found")
    @Response(HttpStatus.FORBIDDEN, "Insufficient permissions")
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
     * Get file metadata by ID
     * @summary Retrieve file information
     * @param fileId UUID of the file to retrieve
     * @returns File metadata including name, size, type, and upload information
     */
    @Get("{fileId}")
    @Middlewares(validateUuidParam("fileId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Invalid file ID format")
    @Response(HttpStatus.NOT_FOUND, "File not found")
    @Response(HttpStatus.FORBIDDEN, "Insufficient permissions")
    @Response(HttpStatus.UNAUTHORIZED, "Unauthorized")
    @Security("bearerAuth", ["file:read"])
    @SuccessResponse(HttpStatus.OK, "File retrieved successfully")
    public async getFileById(@Path() fileId: string): Promise<FileResponse> {
        const file: FileEntity = await this.fileService.getFileById(fileId);
        return FileMapper.toFileResponse(file);
    }

    /**
     * Get all files for a student
     * @summary Retrieve all files associated with a student
     * @param studentId UUID of the student
     * @returns Array of file metadata for the specified student
     */
    @Get("student/{studentId}")
    @Middlewares(validateUuidParam("studentId"))
    @Produces("application/json")
    @Response(HttpStatus.BAD_REQUEST, "Invalid student ID format")
    @Response(HttpStatus.NOT_FOUND, "Student not found")
    @Response(HttpStatus.FORBIDDEN, "Insufficient permissions")
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
     * @summary Preview an image file inline
     * @param fileId UUID of the image file to preview
     * @returns Binary image content with inline display headers
     * @description Displays the image inline in the browser with caching enabled for better performance.
     * Only works with image files. Includes security headers to prevent MIME sniffing attacks.
     */
    @Get("{fileId}/preview")
    @Middlewares(validateUuidParam("fileId"))
    @Produces("image/*")
    @Response(HttpStatus.BAD_REQUEST, "Invalid file ID or file is not an image")
    @Response(HttpStatus.NOT_FOUND, "File not found")
    @Response(HttpStatus.FORBIDDEN, "Insufficient permissions")
    @Response(HttpStatus.UNAUTHORIZED, "Unauthorized")
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
     * @summary Update file information
     * @param fileId UUID of the file to update
     * @param updateFileDTO File metadata to update
     * @returns Updated file metadata
     * @description Updates file metadata such as name, description, and tags.
     * Validates that string fields are not empty when provided.
     */
    @Middlewares(validateUuidParam("fileId"), validateDTO(UpdateFileDTO))
    @Produces("application/json")
    @Put("{fileId}")
    @Response(HttpStatus.BAD_REQUEST, "Validation error or invalid file ID")
    @Response(HttpStatus.NOT_FOUND, "File not found")
    @Response(HttpStatus.FORBIDDEN, "Insufficient permissions")
    @Response(HttpStatus.UNAUTHORIZED, "Unauthorized")
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
     * @summary Upload and associate a file with a student
     * @param studentId UUID of the student to associate the file with
     * @param file The file to upload (multipart/form-data)
     * @param fileType File type - must be one of: certificate, document, image, other, portfolio, resume, transcript
     * @param fileName Optional custom filename (will use original if not provided)
     * @param description Optional description of the file
     * @param tags Optional comma-separated tags for categorization
     * @returns Upload confirmation with file metadata
     * @description Securely uploads a file with comprehensive validation:
     * - Filename validation (blocks dangerous characters, control characters, directory traversal)
     * - File extension validation (blocks executable and dangerous file types)
     * - MIME type validation (warns on mismatches)
     * - String field validation (prevents empty strings)
     *
     * Security features:
     * - Blocks files with dangerous extensions (.exe, .bat, .php, etc.)
     * - Prevents directory traversal attacks (../, ..\)
     * - Sanitizes filenames to remove control characters
     * - Validates against Windows reserved names (CON, PRN, etc.)
     * - Logs suspicious patterns for security monitoring
     */
    @Middlewares(validateUuidParam("studentId"))
    @Post("upload/{studentId}")
    @Produces("application/json")
    @Response(
        HttpStatus.BAD_REQUEST,
        "Validation error - invalid filename, dangerous file type, or invalid student ID",
    )
    @Response(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response(HttpStatus.FORBIDDEN, "Insufficient permissions")
    @Response(HttpStatus.PAYLOAD_TOO_LARGE, "File size exceeds limit")
    @Security("bearerAuth", ["file:create"])
    @SuccessResponse(HttpStatus.CREATED, "File uploaded successfully")
    public async uploadFile(
        @Path() studentId: string,
        @Request() request: AuthenticatedRequest,
        @UploadedFile("file") file: Express.Multer.File,
        /**
         * File type - must be one of: certificate, document, image, other, portfolio, resume, transcript
         * @example "transcript"
         */
        @FormField("fileType") fileType: FileType,
        /**
         * Optional custom filename (will use original if not provided)
         * @example "john_doe_transcript.pdf"
         */
        @FormField("fileName") fileName?: string,
        /**
         * Optional description of the file
         * @example "Student transcript for semester 1"
         */
        @FormField("description") description?: string,
        /**
         * Optional comma-separated tags for categorization
         * @example "academic,transcript,2024"
         */
        @FormField("tags") tags?: string,
    ): Promise<FileResponse> {
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
            createdBy: user.email,
            description: description,
            fileContent: file.buffer,
            fileName: finalFileName,
            filePath: file.path,
            fileSize: file.size,
            fileType: fileType,
            mimeType: file.mimetype,
            modifiedBy: user.email,
            originalFileName: file.originalname,
            studentId: studentId,
            tags: tags,
            uploadedBy: user.id,
        };

        const fileEntity: FileEntity =
            await this.fileService.createFile(createFileDTO);

        return FileMapper.toFileResponse(fileEntity);
    }

    // Private helper methods

    /**
     * Sanitize filename to prevent directory traversal and special characters
     * @param filename The filename to sanitize
     * @returns Sanitized filename safe for filesystem operations
     * @description Used for download sanitization only. Replaces dangerous characters with underscores
     * and ensures the filename is safe for serving to clients. This is a fallback security measure
     * for files that may have been uploaded before strict validation was implemented.
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
     * @param response Express response object
     * @param mimeType MIME type of the file
     * @param filename Sanitized filename for the download
     * @param contentLength Size of the file in bytes
     * @description Sets secure headers for file downloads including:
     * - Content-Disposition: attachment (forces download)
     * - Cache-Control: no-cache (prevents caching of sensitive files)
     * - Content-Security-Policy: default-src 'none' (prevents script execution)
     * - X-Content-Type-Options: nosniff (prevents MIME sniffing attacks)
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
     * @param response Express response object
     * @param mimeType MIME type of the file (should be image/*)
     * @param filename Sanitized filename for the preview
     * @param contentLength Size of the file in bytes
     * @description Sets headers optimized for image previews including:
     * - Content-Disposition: inline (displays in browser)
     * - Cache-Control: public, max-age=3600 (1 hour caching for performance)
     * - ETag for cache validation
     * - X-Content-Type-Options: nosniff (prevents MIME sniffing attacks)
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
     * @param filename The filename to validate
     * @param mimeType The MIME type reported by the client
     * @throws ValidationException if file extension is dangerous
     * @description Validates file extensions to prevent:
     * - Executable file uploads (.exe, .bat, .php, etc.)
     * - Script file uploads (.js, .vbs, .sh, etc.)
     * - Server-side code uploads (.asp, .jsp, .py, etc.)
     * Also logs warnings when MIME type doesn't match file extension.
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
                const position = filename.indexOf(match[0]);
                throw new ValidationException({
                    fileName: `Filename contains invalid character: '${match[0]}' at position ${position.toString()}. Invalid characters: < > : " / \\ | ? *`,
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
     * @param fields Record of field names and their values to validate
     * @throws ValidationException if any field is an empty string
     * @description Validates that optional string fields, when provided, are not empty strings.
     * This prevents accidentally saving empty strings instead of null/undefined values.
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
