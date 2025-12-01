import { BatchScoreExtractionResult } from "@/dto/ocr/ocr.dto.js";
import { FileEntity } from "@/entity/uni_guide/file.entity.js";
import { OcrResultEntity } from "@/entity/uni_guide/ocr-result.entity.js";
export interface IOcrResultService {
    createInitialOcrResults(
        studentId: string,
        createdBy: string,
        files: FileEntity[],
    ): Promise<OcrResultEntity[]>;
    markAsFailed(
        results: OcrResultEntity[],
        errorMessage: string,
        startTime: Date,
    ): Promise<void>;
    updateResults(
        initialResults: OcrResultEntity[],
        batchExtractionResult: BatchScoreExtractionResult,
        processingStartTime: Date,
    ): Promise<OcrResultEntity[]>;
}
