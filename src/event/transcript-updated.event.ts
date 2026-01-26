import { z } from "zod";

import { UUIDSchema } from "@/type/common/uuid.type.js";

export const TranscriptUpdatedEventSchema = z.object({
    studentId: UUIDSchema,
    transcriptIds: z.array(UUIDSchema),
    userId: UUIDSchema.optional(),
});

export type TranscriptUpdatedEvent = z.infer<
    typeof TranscriptUpdatedEventSchema
>;
