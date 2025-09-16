import { FileResponse } from "@/dto/file/file-response.js";
import { FileEntity } from "@/entity/file.entity.js";

export const FileMapper = {
    toFileDownloadResponse(file: FileEntity) {
        return {
            buffer: file.fileContent,
            fileName: file.fileName,
            mimeType: file.mimeType,
            size: file.getHumanReadableFileSize(),
        };
    },

    // Helper method to convert entity to response DTO
    toFileResponse(file: FileEntity): FileResponse {
        return {
            createdAt: file.createdAt,
            description: file.description,
            downloadUrl: `/files/${file.id}/download`,
            fileName: file.fileName,
            fileSize: file.getHumanReadableFileSize(),
            fileType: file.fileType,
            id: file.id,
            metadata: file.metadata,
            mimeType: file.mimeType,
            modifiedAt: file.modifiedAt,
            originalFileName: file.originalFileName,
            previewUrl: file.isImage()
                ? `/files/${file.id}/preview`
                : undefined,
            status: file.status,
            studentId: file.studentId,
            tags: file.tags,
        };
    },

    toFileResponseList(files: FileEntity[]): FileResponse[] {
        return files.map((file) => this.toFileResponse(file));
    },
};
