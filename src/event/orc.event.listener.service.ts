import { inject, injectable } from "inversify";
import { type RedisClientType } from "redis";
import { Repository } from "typeorm";
import { z } from "zod";

import {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
} from "@/dto/predict/ocr.js";
import { FileEntity } from "@/entity/file.js";
import { OcrResultEntity } from "@/entity/ocr.result.entity.js";
import { MistralService } from "@/service/mistral.service.js";
import { OcrResultService } from "@/service/ocr.result.service.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.js";
import { ILogger } from "@/type/interface/logger.js";

const SingleFileCreatedEventSchema = z.object({
    fileId: z.string().uuid("Invalid file ID format"), // Add the specific file ID
    studentId: z.string().uuid("Invalid student ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type SingleFileCreatedEvent = z.infer<
    typeof SingleFileCreatedEventSchema
>;

export const OCR_CHANNEL = "ocr:file_created";

@injectable()
export class OcrEventListenerService {
    constructor(
        @inject(TYPES.RedisSubscriber)
        private readonly redisSubscriber: RedisClientType,
        @inject(TYPES.MistralService)
        private readonly mistralService: MistralService,
        @inject(TYPES.OcrResultService)
        private readonly ocrResultService: OcrResultService,
        @inject(TYPES.FileRepository)
        private readonly fileRepository: Repository<FileEntity>,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    public async cleanup(): Promise<void> {
        try {
            await this.redisSubscriber.unsubscribe(OCR_CHANNEL);
            this.logger.info(`Unsubscribed from channel: ${OCR_CHANNEL}`);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            this.logger.error(`Error unsubscribing from ${OCR_CHANNEL}:`, {
                errorMessage,
            });
            throw error;
        }
    }

    public async initialize(): Promise<void> {
        this.logger.info(
            `Initializing Redis listener for channel: ${OCR_CHANNEL}`,
        );
        try {
            await this.redisSubscriber.subscribe(
                OCR_CHANNEL,
                (message: string) => {
                    void this.handleFileCreated(message);
                },
            );
            this.logger.info(
                `Successfully subscribed to channel: ${OCR_CHANNEL}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to subscribe to channel: ${OCR_CHANNEL}`,
                { error },
            );
            throw error;
        }
    }

    private async handleFileCreated(message: string): Promise<void> {
        const processingStartTime = new Date();
        let payload: null | SingleFileCreatedEvent = null;
        let initialOcrResults: OcrResultEntity[] = [];

        try {
            const rawPayload: unknown = JSON.parse(message);
            payload = SingleFileCreatedEventSchema.parse(rawPayload);
            this.logger.info(
                `Processing OCR for file ${payload.fileId} of student ${payload.studentId}`,
            );

            const existingResult: null | OcrResultEntity =
                await this.ocrResultService.findByFileId(payload.fileId);

            if (existingResult) {
                this.logger.warn(
                    `OCR result already exists for file ${payload.fileId}. Skipping processing.`,
                );
                return;
            }

            const file = await this.fileRepository.findOne({
                relations: ["student"],
                where: { id: payload.fileId, studentId: payload.studentId },
            });

            if (!file) {
                this.logger.warn(`File not found for ID: ${payload.fileId}`);
                return;
            }

            // 2. CREATE placeholder record with 'PROCESSING' status for this specific file
            initialOcrResults =
                await this.ocrResultService.createInitialOcrResults(
                    payload.studentId,
                    payload.userId ?? Role.ANONYMOUS,
                    [file],
                );

            // 3. PROCESS: Call the AI service for this specific file
            const fileExtractionResult: FileScoreExtractionResult =
                await this.mistralService.extractSubjectScoresAnonymously(file);

            // 4. UPDATE the record with the final result
            // Convert single file result to batch format for compatibility with existing updateResults method
            const batchResult: BatchScoreExtractionResult = {
                error: fileExtractionResult.error,
                ocrModel: "mistral-ocr-latest",
                results: [fileExtractionResult],
                success: fileExtractionResult.success,
            };

            await this.ocrResultService.updateResults(
                initialOcrResults,
                batchResult,
                processingStartTime,
            );

            this.logger.info(
                `OCR processing completed for file ${payload.fileId} of student ${payload.studentId}.`,
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            // If placeholder records were created, we must update them to FAILED
            if (initialOcrResults.length > 0) {
                this.logger.error(
                    `Error after creating initial OCR records. Marking them as failed.`,
                    {
                        error: errorMessage,
                        fileId: payload?.fileId,
                        studentId: payload?.studentId,
                    },
                );
                await this.ocrResultService.markAsFailed(
                    initialOcrResults,
                    errorMessage,
                    processingStartTime,
                );
            } else {
                // Handle errors before any records were created (e.g., parsing, fetching file)
                this.logger.error(
                    `OCR pre-processing pipeline failed for file ${payload?.fileId ?? "unknown"}`,
                    {
                        error: errorMessage,
                        fileId: payload?.fileId,
                        studentId: payload?.studentId,
                    },
                );
            }
        }
    }
}
