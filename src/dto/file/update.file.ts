import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

import { FileType } from "@/entity/file";

export class UpdateFileDTO {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsEnum(FileType)
    @IsOptional()
    fileType?: FileType;

    @IsOptional()
    metadata?: Record<string, unknown>;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    originalFileName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    tags?: string;
}
