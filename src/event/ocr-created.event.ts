import z from "zod";

export const OcrCreatedEventSchema = z.object({
    ocrResultIds: z.array(z.string().uuid("Invalid OCR result ID format")),
    studentId: z.string().uuid("Invalid student ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type OcrCreatedEvent = z.infer<typeof OcrCreatedEventSchema>;
