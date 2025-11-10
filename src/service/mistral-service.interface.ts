import {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
} from "@/dto/ocr/ocr.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";

export interface IMistralService {
    extractSubjectScores(
        fileId: string,
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
