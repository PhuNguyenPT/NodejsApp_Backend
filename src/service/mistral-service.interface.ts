import {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
} from "@/dto/predict/ocr.js";
import { FileEntity } from "@/entity/file.entity.js";
import { StudentEntity } from "@/entity/student.entity.js";

export interface IMistralService {
    extractSubjectScores(
        file: FileEntity,
        userId?: string,
    ): Promise<FileScoreExtractionResult>;
    extractSubjectScoresBatch(
        student: StudentEntity,
        fileIds: string[],
        userId?: string,
    ): Promise<BatchScoreExtractionResult>;
    extractSubjectScoresByUserId(
        studentId: string,
        userId: string,
    ): Promise<BatchScoreExtractionResult>;
}
