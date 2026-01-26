import z from "zod";

import { UUIDSchema } from "@/type/common/uuid.type.js";

export const TranscriptCreatedEventSchema = z.object({
    studentId: UUIDSchema,
    transcriptIds: z.array(UUIDSchema),
    userId: UUIDSchema.optional(),
});

export type TranscriptCreatedEvent = z.infer<
    typeof TranscriptCreatedEventSchema
>;
