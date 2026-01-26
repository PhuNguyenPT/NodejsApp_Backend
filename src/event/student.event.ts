import z from "zod";

import { UUIDSchema } from "@/type/common/uuid.type.js";

export const StudentCreatedEventSchema = z.object({
    studentId: UUIDSchema,
    userId: UUIDSchema.optional(),
});

export type StudentCreatedEvent = z.infer<typeof StudentCreatedEventSchema>;
