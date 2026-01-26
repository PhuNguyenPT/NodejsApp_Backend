import z from "zod";

import { UUIDSchema } from "@/type/common/uuid.type.js";

export const OcrCreatedEventSchema = z.object({
    ocrResultIds: z.array(UUIDSchema),
    studentId: UUIDSchema,
    userId: UUIDSchema.optional(),
});

export type OcrCreatedEvent = z.infer<typeof OcrCreatedEventSchema>;
