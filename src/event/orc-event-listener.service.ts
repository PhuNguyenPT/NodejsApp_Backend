import { inject, injectable } from "inversify";
import { Repository } from "typeorm";
import { Logger } from "winston";
import { z } from "zod";

import {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
} from "@/dto/predict/ocr.js";
import { FileEntity } from "@/entity/file.entity.js";
import { OcrResultEntity } from "@/entity/ocr-result.entity.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { IMistralService } from "@/service/mistral-service.interface.js";
import { IOcrResultService } from "@/service/ocr-result-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.js";
import { AccessDeniedException } from "@/type/exception/access-denied.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal-argument.exception.js";

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

@injectable()
export class OcrEventListenerService {
    constructor(
        @inject(TYPES.IMistralService)
        private readonly mistralService: IMistralService,
        @inject(TYPES.IOcrResultService)
        private readonly ocrResultService: IOcrResultService,
        @inject(TYPES.FileRepository)
        private readonly fileRepository: Repository<FileEntity>,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.Logger) private readonly logger: Logger,
    ) {}

    public async handleFileCreatedEvent(
        event: FilesCreatedEvent | SingleFileCreatedEvent,
    ): Promise<void> {
        try {
            const parsed = OcrEventSchema.safeParse(event);

            if (!parsed.success) {
                this.logger.error(
                    "Failed to validate OCR event. Invalid schema.",
                    {
                        errors: parsed.error.format(),
                        event,
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
            this.logger.error("Error handling file created event.", {
                error,
                event,
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
            const batchExtractionResult: BatchScoreExtractionResult =
                await this.mistralService.extractSubjectScoresBatch(
                    student,
                    fileIdsToProcess,
                    payload.userId,
                );

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

            const fileExtractionResult: FileScoreExtractionResult =
                await this.mistralService.extractSubjectScores(
                    file,
                    payload.userId,
                );

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
