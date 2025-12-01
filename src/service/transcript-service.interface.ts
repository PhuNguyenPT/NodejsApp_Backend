import { OcrUpdateRequest } from "@/dto/ocr/ocr-update-request.dto.js";
import { SubjectScore } from "@/dto/ocr/ocr.dto.js";
import { TranscriptEntity } from "@/entity/uni_guide/transcript.entity.js";

export interface ITranscriptService {
    findByStudentIdAndUserId(
        studentId: string,
        userId?: string,
    ): Promise<TranscriptEntity[]>;
    patchByIdAndCreatedBy(
        id: string,
        ocrUpdateRequest: OcrUpdateRequest,
        createdBy?: string,
    ): Promise<{ id: string; subjectScores: SubjectScore[] }>;
}
