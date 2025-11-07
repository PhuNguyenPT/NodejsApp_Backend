// src/dto/file/create.file.ts
import {
    IsEnum,
    IsInstance,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
} from "class-validator";

import { FileType } from "@/entity/uni_guide/file.entity.js";

/**
 * Data Transfer Object for creating new files
 * @description Contains all required and optional fields for file creation
 */
export class CreateFileDTO {
    /**
     * Optional uploader identifier
     * @description User email
     * @example "jane.doe@example.com"
     */
    @IsNotEmpty()
    @IsString()
    createdBy!: string;

    /**
     * Optional file description
     * @description Additional context or details about the file content
     * @example "Student transcript for Fall 2024 semester"
     */
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    /**
     * Binary file content
     * @description The actual file data stored as a Buffer
     * @example Buffer.from("file content bytes")
     */
    @IsInstance(Buffer, { message: "File content must be a Buffer" })
    @IsNotEmpty()
    fileContent!: Buffer;

    /**
     * Display filename
     * @description The name to use for display and download purposes
     * @example "john_doe_transcript.pdf"
     */
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    fileName!: string;

    /**
     * Internal file path
     * @description System path where the file will be stored
     * @example "/uploads/students/123e4567-e89b-12d3-a456-426614174000/john_doe_transcript.pdf"
     */
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    filePath!: string;

    /**
     * File size in bytes
     * @description Size of the file content in bytes
     * @example 1048576
     */
    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: "File size must be greater than 0" })
    fileSize!: number;

    /**
     * File type categorization
     * @description Category that this file belongs to
     * @example FileType.TRANSCRIPT
     */
    @IsEnum(FileType, { message: "Invalid file type" })
    fileType!: FileType;

    /**
     * Optional metadata object
     * @description Additional structured data to associate with the file
     * @example { "semester": "Fall 2024", "grade": "A", "credits": 3 }
     */
    @IsOptional()
    metadata?: Record<string, unknown>;

    /**
     * MIME type of the file
     * @description Content type as detected during upload
     * @example "application/pdf"
     */
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    mimeType!: string;

    /**
     * Original filename from upload
     * @description The filename as it was when originally uploaded
     * @example "transcript_fall_2024.pdf"
     */
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    originalFileName!: string;

    /**
     * Student identifier
     * @description UUID of the student this file is associated with
     * @example "123e4567-e89b-12d3-a456-426614174000"
     */
    @IsUUID(4, { message: "Student ID must be a valid UUID" })
    studentId!: string;

    /**
     * Optional comma-separated tags
     * @description Tags for categorization and searchability
     * @example "academic,transcript,fall2024,important"
     */
    @IsOptional()
    @IsString()
    @MaxLength(255)
    tags?: string;
}
