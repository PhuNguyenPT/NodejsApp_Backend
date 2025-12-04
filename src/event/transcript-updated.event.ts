import { z } from "zod";

export const TranscriptUpdatedEventSchema = z.object({
    studentId: z.string().uuid("Invalid student ID format"),
    transcriptId: z.string().uuid("Invalid transcript ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type TranscriptUpdatedEvent = z.infer<
    typeof TranscriptUpdatedEventSchema
>;
