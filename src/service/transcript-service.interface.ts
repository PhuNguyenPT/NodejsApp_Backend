import type { OcrRequest } from "@/dto/ocr/ocr-request.dto.js";
import type { OcrUpdateRequest } from "@/dto/ocr/ocr-update-request.dto.js";
import type { SubjectScore } from "@/dto/ocr/subject-score.dto.js";
import type { TranscriptEntity } from "@/entity/uni_guide/transcript.entity.js";
import type { UUID } from "@/type/common/uuid.type.js";

export interface ITranscriptService {
    findByStudentIdAndUserId(
        studentId: UUID,
        userId?: UUID,
    ): Promise<TranscriptEntity[]>;
    patchByIdAndCreatedBy(
        id: UUID,
        ocrUpdateRequest: OcrUpdateRequest,
        createdBy?: string,
    ): Promise<{ id: string; subjectScores: SubjectScore[] }>;
    saveByStudentIdAndUserId(
        studentId: UUID,
        ocrRequest: OcrRequest,
        userId?: UUID,
    ): Promise<TranscriptEntity>;
}
