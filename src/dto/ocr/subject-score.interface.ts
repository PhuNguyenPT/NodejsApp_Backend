import { z } from "zod";

import { TranscriptSubject } from "@/type/enum/transcript-subject.js";

export interface ISubjectScore {
    name: TranscriptSubject;
    score: number;
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
