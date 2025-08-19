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
import { StudentEntity } from "@/entity/student.js";
import { MistralService } from "@/service/mistral.service.js";
import { OcrResultService } from "@/service/ocr.result.service.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.js";
import { AccessDeniedException } from "@/type/exception/access.denied.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal.argument.exception.js";
import { ILogger } from "@/type/interface/logger.js";

const SingleFileCreatedEventSchema = z.object({
    fileId: z.string().uuid("Invalid file ID format"),
    studentId: z.string().uuid("Invalid student ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type SingleFileCreatedEvent = z.infer<
    typeof SingleFileCreatedEventSchema
>;

const FilesCreatedEventSchema = z.object({
    fileIds: z.array(z.string().uuid("Invalid file ID format")),
    studentId: z.string().uuid("Invalid student ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type FilesCreatedEvent = z.infer<typeof FilesCreatedEventSchema>;

// Union schema to validate against either event type
const OcrEventSchema = z.union([
    SingleFileCreatedEventSchema,
    FilesCreatedEventSchema,
]);

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
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
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
                    void this.handleMessage(message);
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

    private async handleMessage(message: string): Promise<void> {
        try {
            const rawPayload: unknown = JSON.parse(message);
            const parsed = OcrEventSchema.safeParse(rawPayload);

            if (!parsed.success) {
                this.logger.error(
                    "Failed to parse OCR event message. Invalid schema.",
                    {
                        errors: parsed.error.format(),
                        message,
                    },
                );
                return;
            }

            const payload = parsed.data;

            if ("fileIds" in payload) {
                await this.processMultipleFiles(payload);
            } else {
                await this.processSingleFile(payload);
            }
        } catch (error) {
            this.logger.error("Error handling 'file created' message.", {
                error,
                message,
            });
        }
    }

    private async processMultipleFiles(
        payload: FilesCreatedEvent,
    ): Promise<void> {
        const processingStartTime = new Date();
        let initialOcrResults: OcrResultEntity[] = [];

        try {
            const { fileIds, studentId, userId } = payload;

            if (fileIds.length === 0) {
                this.logger.warn(
                    `Empty fileIds array in batch processing for student ${studentId}`,
                );
                return;
            }

            this.logger.info(
                `Processing batch OCR for ${fileIds.length.toString()} files for student ${studentId}`,
            );

            // 1. Fetch student with files in a single query
            const student: null | StudentEntity =
                await this.studentRepository.findOne({
                    relations: ["files"],
                    where: { id: studentId },
                });

            if (!student) {
                throw new IllegalArgumentException(
                    `Invalid student id ${studentId}`,
                );
            }

            // Check access permissions
            if (userId && student.userId !== userId) {
                throw new AccessDeniedException("Access denied");
            }

            // 2. Filter files to only those requested in the payload
            const filesToProcess: FileEntity[] =
                student.files?.filter((file) => fileIds.includes(file.id)) ??
                [];

            if (filesToProcess.length === 0) {
                this.logger.warn(
                    `No valid files found for the given IDs and student ${studentId}.`,
                );
                return;
            }

            // 3. Create initial OCR results (only once, with proper filtering)
            initialOcrResults =
                await this.ocrResultService.createInitialOcrResults(
                    studentId,
                    userId ?? Role.ANONYMOUS,
                    filesToProcess,
                );

            if (initialOcrResults.length === 0) {
                this.logger.warn(
                    `Skipping batch processing as no new OCR records were created for student ${studentId}. All files may already have results.`,
                );
                return;
            }

            // 4. Only process files that had OCR results created
            const fileIdsToProcess: string[] = initialOcrResults.map(
                (result) => result.fileId,
            );

            // 5. Call appropriate Mistral service method
            let batchExtractionResult: BatchScoreExtractionResult;
            if (payload.userId) {
                batchExtractionResult =
                    await this.mistralService.extractSubjectScoresBatch(
                        student,
                        payload.userId,
                        fileIdsToProcess,
                    );
            } else {
                batchExtractionResult =
                    await this.mistralService.extractSubjectScoresBatchAnonymously(
                        student,
                        fileIdsToProcess,
                    );
            }

            // 6. Update results
            await this.ocrResultService.updateResults(
                initialOcrResults,
                batchExtractionResult,
                processingStartTime,
            );

            this.logger.info(
                `Batch OCR processing completed for student ${studentId}. Processed ${initialOcrResults.length.toString()} files.`,
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            if (initialOcrResults.length > 0) {
                this.logger.error(
                    `Error during batch OCR processing for student ${payload.studentId}. Marking ${initialOcrResults.length.toString()} records as failed.`,
                    { error: errorMessage },
                );
                await this.ocrResultService.markAsFailed(
                    initialOcrResults,
                    errorMessage,
                    processingStartTime,
                );
            } else {
                this.logger.error(
                    `OCR batch pre-processing pipeline failed for student ${payload.studentId}`,
                    { error: errorMessage },
                );
            }
        }
    }

    /**
     * Processes a single file.
     */
    private async processSingleFile(
        payload: SingleFileCreatedEvent,
    ): Promise<void> {
        const processingStartTime = new Date();
        let initialOcrResults: OcrResultEntity[] = [];

        try {
            this.logger.info(
                `Processing OCR for file ${payload.fileId} of student ${payload.studentId}`,
            );

            const file = await this.fileRepository.findOne({
                relations: ["student"],
                where: { id: payload.fileId, studentId: payload.studentId },
            });

            if (!file) {
                this.logger.warn(`File not found for ID: ${payload.fileId}`);
                return;
            }

            // Add missing access control check
            if (payload.userId && file.student.userId !== payload.userId) {
                throw new AccessDeniedException(
                    `Access denied: User ${payload.userId} cannot access file ${payload.fileId}`,
                );
            }

            initialOcrResults =
                await this.ocrResultService.createInitialOcrResults(
                    payload.studentId,
                    payload.userId ?? Role.ANONYMOUS,
                    [file],
                );

            if (initialOcrResults.length === 0) {
                this.logger.warn(
                    `OCR result already exists for file ${payload.fileId}. Skipping processing.`,
                );
                return;
            }

            let fileExtractionResult: FileScoreExtractionResult;
            if (payload.userId) {
                fileExtractionResult =
                    await this.mistralService.extractSubjectScores(
                        file,
                        payload.userId,
                    );
            } else {
                fileExtractionResult =
                    await this.mistralService.extractSubjectScoresAnonymously(
                        file,
                    );
            }

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

            if (initialOcrResults.length > 0) {
                this.logger.error(
                    `Error after creating initial OCR records for file ${payload.fileId}. Marking as failed.`,
                    {
                        error: errorMessage,
                        fileId: payload.fileId,
                        studentId: payload.studentId,
                    },
                );
                await this.ocrResultService.markAsFailed(
                    initialOcrResults,
                    errorMessage,
                    processingStartTime,
                );
            } else {
                this.logger.error(
                    `OCR pre-processing pipeline failed for file ${payload.fileId}`,
                    {
                        error: errorMessage,
                        fileId: payload.fileId,
                        studentId: payload.studentId,
                    },
                );
            }
        }
    }
}
