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

import { FileType } from "@/entity/file.js";

export class CreateFileDTO {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsInstance(Buffer, { message: "File content must be a Buffer" })
    @IsNotEmpty()
    fileContent!: Buffer;

    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    fileName!: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    filePath!: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: "File size must be greater than 0" })
    fileSize!: number;

    @IsEnum(FileType, { message: "Invalid file type" })
    fileType!: FileType;

    @IsOptional()
    metadata?: Record<string, unknown>;

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    mimeType!: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    originalFileName!: string;

    @IsUUID(4, { message: "Student ID must be a valid UUID" })
    studentId!: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    tags?: string;

    @IsOptional()
    @IsUUID(4, { message: "Uploaded by must be a valid UUID" })
    uploadedBy?: string;
}
