import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { Logger } from "winston";

import { TYPES } from "@/type/container/types.js";

import {
    OcrCreatedEvent,
    OcrCreatedEventSchema,
} from "../ocr-created.event.js";
import { IOcrEventListener } from "../ocr-event-listener.interface.js";
import { IPredictionL3ProcessorService } from "../prediction-response-processor-service.interface.js";

@injectable()
export class OcrEventListener implements IOcrEventListener {
    private readonly ALLOWED_OCR_COUNTS = [3, 6];

    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.IPredictionL3ProcessorService)
        private readonly predictionL3ProcessorService: IPredictionL3ProcessorService,
        @inject(TYPES.DataSource) private readonly dataSource: DataSource,
    ) {}

    public async handleOcrCreatedEvent(event: OcrCreatedEvent): Promise<void> {
        try {
            const parsed = OcrCreatedEventSchema.safeParse(event);
            if (!parsed.success) {
                this.logger.error(
                    "Schema validation failed for OCR created event",
                    {
                        errors: parsed.error.format(),
                        event,
                    },
                );
                return;
            }

            const payload = parsed.data;
            const { ocrResultIds, studentId, userId } = payload;

            this.logger.info("Processing OCR created event", {
                ocrResultIds,
                ocrResultIdsCount: ocrResultIds.length,
                studentId,
                userId,
            });

            if (!this.validateOcrCount(ocrResultIds, studentId)) {
                return;
            }

            await this.predictionL3ProcessorService.processL3PredictionInTransaction(
                this.dataSource.manager,
                studentId,
                userId,
            );
        } catch (error) {
            this.logger.error("Error handling 'OCR created' event.", {
                error,
                event,
            });
        }
    }

    /**
     * Validate that OCR result IDs count is exactly 3 or 6
     * @returns true if valid, false otherwise
     */
    private validateOcrCount(
        ocrResultIds: string[],
        studentId: string,
    ): boolean {
        const count = ocrResultIds.length;

        if (!this.ALLOWED_OCR_COUNTS.includes(count)) {
            this.logger.warn(
                `OCR created event: Invalid OCR result count. Expected 3 or 6, got ${count.toString()}`,
                {
                    allowedCounts: this.ALLOWED_OCR_COUNTS,
                    ocrResultIds,
                    ocrResultIdsCount: count,
                    studentId,
                },
            );
            return false;
        }

        return true;
    }
}
