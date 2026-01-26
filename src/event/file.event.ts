import { z } from "zod";

import { UUIDSchema } from "@/type/common/uuid.type.js";

const SingleFileCreatedEventSchema = z.object({
    fileId: UUIDSchema,
    studentId: UUIDSchema,
    userId: UUIDSchema.optional(),
});

export type SingleFileCreatedEvent = z.infer<
    typeof SingleFileCreatedEventSchema
>;

const FilesCreatedEventSchema = z.object({
    fileIds: z.array(UUIDSchema),
    studentId: UUIDSchema,
    userId: UUIDSchema.optional(),
});

export type FilesCreatedEvent = z.infer<typeof FilesCreatedEventSchema>;

export const OcrEventSchema = z.union([
    SingleFileCreatedEventSchema,
    FilesCreatedEventSchema,
]);
