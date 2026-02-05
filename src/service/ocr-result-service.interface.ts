import type { BatchScoreExtractionResult } from "@/dto/ocr/score-extraction-result.js";
import type { FileEntity } from "@/entity/uni_guide/file.entity.js";
import type { OcrResultEntity } from "@/entity/uni_guide/ocr-result.entity.js";
import type { UUID } from "@/type/common/uuid.type.js";
export interface IOcrResultService {
    createInitialOcrResults(
        studentId: UUID,
        createdBy: string,
        files: FileEntity[],
    ): Promise<OcrResultEntity[]>;
    markAsFailed(
        results: OcrResultEntity[],
        errorMessage: string,
        startTime: number,
    ): Promise<void>;
    updateResults(
        initialResults: OcrResultEntity[],
        batchExtractionResult: BatchScoreExtractionResult,
        processingStartTime: number,
    ): Promise<OcrResultEntity[]>;
}
