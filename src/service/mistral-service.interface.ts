import type {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
} from "@/dto/ocr/score-extraction-result.js";
import type { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import type { UUID } from "@/type/common/uuid.type.js";

export interface IMistralService {
    extractSubjectScores(
        fileId: UUID,
        userId?: UUID,
    ): Promise<FileScoreExtractionResult>;
    extractSubjectScoresBatch(
        student: StudentEntity,
        fileIds: UUID[],
        userId?: UUID,
    ): Promise<BatchScoreExtractionResult>;
    extractSubjectScoresByUserId(
        studentId: UUID,
        userId: UUID,
    ): Promise<BatchScoreExtractionResult>;
}
