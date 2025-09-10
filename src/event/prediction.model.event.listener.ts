import { inject, injectable } from "inversify";
import z from "zod";

import {
    EventListener,
    RedisEventListener,
} from "@/decorator/redis.event.listener.decorator.js";
import { PredictionModelService } from "@/service/prediction.model.service.js";
import { TYPES } from "@/type/container/types.js";
import { ILogger } from "@/type/interface/logger.js";

export const PREDICTION_CHANNEL = "prediction:student_created";

const StudentCreatedEventSchema = z.object({
    studentId: z.string().uuid("Invalid student ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type StudentCreatedEvent = z.infer<typeof StudentCreatedEventSchema>;
@EventListener(TYPES.PredictionModelEventListener)
@injectable()
export class PredictionModelEventListener {
    constructor(
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.PredictionModelService)
        private readonly predictionModelService: PredictionModelService,
    ) {}

    @RedisEventListener(PREDICTION_CHANNEL)
    private async handleStudentCreatedEvent(message: string): Promise<void> {
        try {
            const rawPayload: unknown = JSON.parse(message);
            const parsed = StudentCreatedEventSchema.safeParse(rawPayload);
            if (!parsed.success) {
                // Specifically handle validation errors
                this.logger.error("Schema validation failed", {
                    errors: parsed.error.format(), // Detailed validation errors
                    message,
                });
                return; // Exit gracefully
            }

            const payload = parsed.data;
            await this.predictionModelService.getL2PredictResults(
                payload.studentId,
                payload.studentId,
            );
        } catch (error) {
            this.logger.error("Error handling 'student created' message.", {
                error,
                message,
            });
        }
    }
}
