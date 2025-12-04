import { ISubjectScore } from "./subject-score.interface.js";

/**
 * The final, aggregated result containing outcomes for all processed files.
 */
export interface BatchScoreExtractionResult {
    error?: string;
    ocrModel?: string;
    results: FileScoreExtractionResult[];
    success: boolean;
}

/**
 * Represents the structured result for a single processed file.
 */
export interface FileScoreExtractionResult {
    documentAnnotation?: string;
    error?: string;
    fileId: string;
    fileName: string;
    scores: ISubjectScore[];
    success: boolean;
}

/**
 * The result of an extraction attempt on a SINGLE file.
 */
export interface ScoreExtractionResult {
    documentAnnotation?: string;
    error?: string;
    scores: ISubjectScore[];
    success: boolean;
}
