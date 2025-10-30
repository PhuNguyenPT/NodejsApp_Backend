import { z } from "zod";

const SingleFileCreatedEventSchema = z.object({
    fileId: z.string().uuid("Invalid file ID format"),
    studentId: z.string().uuid("Invalid student ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type SingleFileCreatedEvent = z.infer<
    typeof SingleFileCreatedEventSchema
>;

const FilesCreatedEventSchema = z.object({
    fileIds: z.array(z.string().uuid("Invalid file ID format")),
    studentId: z.string().uuid("Invalid student ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type FilesCreatedEvent = z.infer<typeof FilesCreatedEventSchema>;

// Union schema to validate against either event type
export const OcrEventSchema = z.union([
    SingleFileCreatedEventSchema,
    FilesCreatedEventSchema,
]);
