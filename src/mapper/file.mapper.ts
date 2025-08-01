import { FileResponse } from "@/dto/file/file.response";
import { FileEntity } from "@/entity/file";

export const FileMapper = {
    // Helper method to convert entity to response DTO
    toFileResponse(file: FileEntity): FileResponse {
        return {
            createdAt: file.createdAt,
            description: file.description,
            fileName: file.fileName,
            fileSize: file.getHumanReadableFileSize(),
            fileType: file.fileType,
            id: file.id,
            metadata: file.metadata,
            mimeType: file.mimeType,
            modifiedAt: file.modifiedAt,
            originalFileName: file.originalFileName,
            status: file.status,
            tags: file.tags,
            uploadedBy: file.uploader?.email,
        };
    },

    toFileResponseList(files: FileEntity[]): FileResponse[] {
        return files.map((file) => this.toFileResponse(file));
    },
};
