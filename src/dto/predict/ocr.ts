import { z } from "zod";

import { VietnameseSubject } from "@/type/enum/subject.js";

export interface ISubjectScore {
    name: VietnameseSubject;
    score: number;
}

export interface ITranscript {
    subjects: ISubjectScore[];
}

export const SubjectScoreSchema = z.object({
    name: z
        .nativeEnum(VietnameseSubject)
        .describe("Vietnamese subject name from enum"),
    score: z.number().describe("ĐTB score on 0-10 scale"),
});

export const TranscriptSchema = z.object({
    subjects: z
        .array(SubjectScoreSchema)
        .describe("Subject scores extracted from transcript"),
});

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
    scores: SubjectScore[];
    success: boolean;
}

/**
 * The result of an extraction attempt on a SINGLE file.
 */
export interface ScoreExtractionResult {
    documentAnnotation?: string;
    error?: string;
    scores: SubjectScore[];
    success: boolean;
}

export type SubjectScore = ISubjectScore;
export type Transcript = ITranscript;
