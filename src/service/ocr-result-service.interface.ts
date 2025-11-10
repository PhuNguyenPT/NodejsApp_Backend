import { OcrUpdateRequest } from "@/dto/ocr/ocr-update-request.js";
import { BatchScoreExtractionResult } from "@/dto/ocr/ocr.js";
import { FileEntity } from "@/entity/uni_guide/file.entity.js";
import { OcrResultEntity } from "@/entity/uni_guide/ocr-result.entity.js";
export interface IOcrResultService {
    createInitialOcrResults(
        studentId: string,
        createdBy: string,
        files: FileEntity[],
    ): Promise<OcrResultEntity[]>;
    findByStudentIdAndUsername(
        studentId: string,
        username?: string,
    ): Promise<OcrResultEntity[]>;
    markAsFailed(
        results: OcrResultEntity[],
        errorMessage: string,
        startTime: Date,
    ): Promise<void>;
    patchByStudentIdAndFileId(
        id: string,
        ocrUpdateRequest: OcrUpdateRequest,
        username?: string,
    ): Promise<OcrResultEntity>;
    updateResults(
        initialResults: OcrResultEntity[],
        batchExtractionResult: BatchScoreExtractionResult,
        processingStartTime: Date,
    ): Promise<void>;
}
