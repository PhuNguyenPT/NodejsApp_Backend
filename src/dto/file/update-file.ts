// src/dto/file/update.file.ts
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

import { FileType } from "@/entity/file.entity.js";

/**
 * Data Transfer Object for updating file metadata
 * @description Contains optional fields that can be updated for an existing file
 */
export class UpdateFileRequest {
    /**
     * Optional description of the file
     * @description Provides additional context or details about the file content
     * @example "Updated student transcript for Fall 2024 semester"
     */
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    /**
     * Optional new filename
     * @description The display name for the file (without changing the actual stored file)
     * @example "john_doe_transcript_updated.pdf"
     */
    @IsOptional()
    @IsString()
    @MaxLength(255)
    fileName?: string;

    /**
     * Optional file type categorization
     * @description Changes the category/type classification of the file
     * @example FileType.TRANSCRIPT
     */
    @IsEnum(FileType)
    @IsOptional()
    fileType?: FileType;

    /**
     * Optional metadata object
     * @description Additional structured data associated with the file
     * @example { "semester": "Fall 2024", "grade": "A", "credits": 3 }
     */
    @IsOptional()
    metadata?: Record<string, unknown>;

    /**
     * Optional comma-separated tags
     * @description Tags for categorization and searchability
     * @example "academic,transcript,fall2024,completed"
     */
    @IsOptional()
    @IsString()
    @MaxLength(255)
    tags?: string;
}
