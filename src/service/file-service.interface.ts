import { CreateFileDTO } from "@/dto/file/create-file.js";
import { UpdateFileRequest } from "@/dto/file/update-file.js";
import { FileEntity } from "@/entity/file.entity.js";

export interface IFileService {
    createFile(
        createFileDTO: CreateFileDTO,
        userId?: string,
    ): Promise<FileEntity>;
    createFiles(
        createFileDTOs: CreateFileDTO[],
        studentId: string,
        userId?: string,
    ): Promise<FileEntity[]>;
    getFileById(fileId: string, userId?: string): Promise<FileEntity>;
    updateFile(
        fileId: string,
        updateFileDTO: UpdateFileRequest,
        userId?: string,
    ): Promise<FileEntity>;
}
