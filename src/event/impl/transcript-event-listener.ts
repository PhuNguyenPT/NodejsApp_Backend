import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { Logger } from "winston";

import {
    TranscriptCreatedEvent,
    TranscriptCreatedEventSchema,
} from "@/event/transcript-created.event.js";
import { ITranscriptEventListener } from "@/event/transcript-event-listener.interface.js";
import {
    TranscriptUpdatedEvent,
    TranscriptUpdatedEventSchema,
} from "@/event/transcript-updated.event.js";
import { IPredictionL3ProcessorService } from "@/service/prediction-response-processor-service.interface.js";
import { TYPES } from "@/type/container/types.js";

@injectable()
export class TranscriptEventListener implements ITranscriptEventListener {
    private readonly ALLOWED_TRANSCRIPT_COUNTS = [3, 6];

    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.IPredictionL3ProcessorService)
        private readonly predictionL3ProcessorService: IPredictionL3ProcessorService,
        @inject(TYPES.DataSource) private readonly dataSource: DataSource,
    ) {}

    public async handleTranscriptCreatedEvent(
        event: TranscriptCreatedEvent,
    ): Promise<void> {
        try {
            const parsed = TranscriptCreatedEventSchema.safeParse(event);
            if (!parsed.success) {
                this.logger.error(
                    "Schema validation failed for Transcript created event",
                    {
                        errors: parsed.error.format(),
                        event,
                    },
                );
                return;
            }

            const payload = parsed.data;
            const { studentId, transcriptIds, userId } = payload;

            this.logger.info("Processing Transcript created event", {
                studentId,
                transcriptIds,
                transcriptIdsCount: transcriptIds.length,
                userId,
            });

            if (
                !this.validateTranscriptCount(
                    transcriptIds,
                    studentId,
                    "created",
                )
            ) {
                return;
            }

            await this.predictionL3ProcessorService.processL3PredictionInTransaction(
                this.dataSource.manager,
                studentId,
                userId,
            );
        } catch (error) {
            this.logger.error("Error handling 'Transcript created' event.", {
                error,
                event,
            });
        }
    }

    public async handleTranscriptUpdatedEvent(
        event: TranscriptUpdatedEvent,
    ): Promise<void> {
        try {
            const parsed = TranscriptUpdatedEventSchema.safeParse(event);
            if (!parsed.success) {
                this.logger.error(
                    "Schema validation failed for Transcript updated event",
                    {
                        errors: parsed.error.format(),
                        event,
                    },
                );
                return;
            }

            const payload = parsed.data;
            const { studentId, transcriptIds, userId } = payload;

            this.logger.info("Processing Transcript updated event", {
                studentId,
                transcriptIds,
                transcriptIdsCount: transcriptIds.length,
                userId,
            });

            if (
                !this.validateTranscriptCount(
                    transcriptIds,
                    studentId,
                    "updated",
                )
            ) {
                return;
            }

            await this.predictionL3ProcessorService.processL3PredictionInTransaction(
                this.dataSource.manager,
                studentId,
                userId,
            );
        } catch (error) {
            this.logger.error("Error handling 'Transcript updated' event.", {
                error,
                event,
            });
        }
    }

    /**
     * Validate that transcript IDs count is exactly 3 or 6
     * @returns true if valid, false otherwise
     */
    private validateTranscriptCount(
        transcriptIds: string[],
        studentId: string,
        eventType: "created" | "updated",
    ): boolean {
        const count = transcriptIds.length;

        if (!this.ALLOWED_TRANSCRIPT_COUNTS.includes(count)) {
            this.logger.warn(
                `Transcript ${eventType} event: Invalid transcript count. Expected 3 or 6, got ${count.toString()}`,
                {
                    allowedCounts: this.ALLOWED_TRANSCRIPT_COUNTS,
                    eventType,
                    studentId,
                    transcriptIds,
                    transcriptIdsCount: count,
                },
            );
            return false;
        }

        return true;
    }
}
