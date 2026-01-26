import type { CreateFileDTO } from "@/dto/file/create-file.js";
import type { UpdateFileRequest } from "@/dto/file/update-file.js";
import type { FileEntity } from "@/entity/uni_guide/file.entity.js";
import type { UUID } from "@/type/common/uuid.type.js";

export interface IFileService {
    createFile(
        createFileDTO: CreateFileDTO,
        userId?: UUID,
    ): Promise<FileEntity>;
    createFiles(
        createFileDTOs: CreateFileDTO[],
        studentId: UUID,
        userId?: UUID,
    ): Promise<FileEntity[]>;
    deleteFile(fileId: UUID, userId?: UUID): Promise<void>;
    getFileById(fileId: UUID, userId?: UUID): Promise<FileEntity>;
    getFilesMetadataByStudentId(
        studentId: UUID,
        userId?: UUID,
    ): Promise<FileEntity[]>;
    updateFile(
        fileId: UUID,
        updateFileDTO: UpdateFileRequest,
        userId?: UUID,
    ): Promise<FileEntity>;
}
