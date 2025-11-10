import { Expose } from "class-transformer";
import { IsEnum, IsNumber, Max, Min } from "class-validator";
import { z } from "zod";

import { TranscriptSubject } from "@/type/enum/transcript-subject.js";

export interface ISubjectScore {
    name: TranscriptSubject;
    score: number;
}

export class SubjectScore implements ISubjectScore {
    @Expose()
    @IsEnum(TranscriptSubject)
    name!: TranscriptSubject;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    score!: number;
}

export const ISubjectScoreSchema = z.object({
    name: z
        .nativeEnum(TranscriptSubject)
        .describe("Vietnamese subject name from enum"),
    score: z
        .number()
        .describe(
            "ĐTB, TBM, TBm, or final score column in Vietnamese on 0-10 scale",
        ),
});

export const TranscriptSchema = z.object({
    subjects: z
        .array(ISubjectScoreSchema)
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

export class OcrResultResponse {
    @Expose()
    createdAt!: Date;

    @Expose()
    fileId!: string;

    @Expose()
    id!: string;

    @Expose()
    processedBy!: string;

    @Expose()
    scores!: ISubjectScore[];
}
