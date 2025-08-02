import { FileType } from "@/entity/file";

// src/dto/file/file.response.ts
export class FileResponse {
    createdAt!: Date;
    description?: string;
    downloadUrl?: string;
    fileName!: string;
    fileSize!: string;
    fileType!: FileType;
    id!: string;
    metadata?: Record<string, unknown>;
    mimeType!: string;
    modifiedAt!: Date;
    originalFileName!: string;
    previewUrl?: string; // Only for images
    status!: string;
    tags?: string;
    uploadedBy?: string;
}

export class FileUploadResponse {
    fileName!: string;
    filePath!: string;
    fileSize!: string;
    fileType!: FileType;
    id!: string;
    message!: string;
    originalFileName!: string;
}
