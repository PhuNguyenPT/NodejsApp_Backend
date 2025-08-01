// src/controller/file.controller.ts
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
     * Get file by ID
     */
    @Get("{fileId}")
    @Middlewares(validateUuidParam("fileId"))
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
     * Update file metadata
     */
    @Middlewares(validateUuidParam("fileId"), validateDTO(UpdateFileDTO))
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
