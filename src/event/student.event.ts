import z from "zod";

export const StudentCreatedEventSchema = z.object({
    studentId: z.string().uuid("Invalid student ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type StudentCreatedEvent = z.infer<typeof StudentCreatedEventSchema>;
