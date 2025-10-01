import { OcrUpdateRequest } from "@/dto/ocr/ocr-update-request.js";
import { BatchScoreExtractionResult } from "@/dto/predict/ocr.js";
import { FileEntity } from "@/entity/file.entity.js";
import { OcrResultEntity } from "@/entity/ocr-result.entity.js";

export interface IOcrResultService {
    createInitialOcrResults(
        studentId: string,
        userId: string,
        files: FileEntity[],
    ): Promise<OcrResultEntity[]>;
    findById(id: string, processedBy?: string): Promise<OcrResultEntity>;
    findByStudentId(
        studentId: string,
        userId?: string,
    ): Promise<OcrResultEntity[]>;
    markAsFailed(
        results: OcrResultEntity[],
        errorMessage: string,
        startTime: Date,
    ): Promise<void>;
    patchByStudentIdAndFileId(
        id: string,
        ocrUpdateRequest: OcrUpdateRequest,
        userId?: string,
    ): Promise<OcrResultEntity>;
    updateResults(
        initialResults: OcrResultEntity[],
        batchExtractionResult: BatchScoreExtractionResult,
        processingStartTime: Date,
    ): Promise<void>;
}
