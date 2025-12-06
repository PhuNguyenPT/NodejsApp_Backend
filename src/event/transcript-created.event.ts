import z from "zod";

export const TranscriptCreatedEventSchema = z.object({
    studentId: z.string().uuid("Invalid student ID format"),
    transcriptIds: z.array(z.string().uuid("Invalid transcripts ID format")),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type TranscriptCreatedEvent = z.infer<
    typeof TranscriptCreatedEventSchema
>;
