import { inject, injectable } from "inversify";
import { Repository } from "typeorm";
import { Logger } from "winston";

import {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
} from "@/dto/ocr/ocr.dto.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { FileEntity } from "@/entity/uni_guide/file.entity.js";
import {
    OcrResultEntity,
    OcrStatus,
} from "@/entity/uni_guide/ocr-result.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TranscriptSubjectEntity } from "@/entity/uni_guide/transcript-subject.entity.js";
import { TranscriptEntity } from "@/entity/uni_guide/transcript.entity.js";
import { IMistralService } from "@/service/mistral-service.interface.js";
import { IOcrResultService } from "@/service/ocr-result-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.js";
import { AccessDeniedException } from "@/type/exception/access-denied.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal-argument.exception.js";

import { IFileEventListener } from "../file-event-listener.interface.js";
import {
    FilesCreatedEvent,
    OcrEventSchema,
    SingleFileCreatedEvent,
} from "../file.event.js";
import { OcrCreatedEvent } from "../ocr-created.event.js";
import { IOcrEventListener } from "../ocr-event-listener.interface.js";

@injectable()
export class FileEventListener implements IFileEventListener {
    constructor(
        @inject(TYPES.IMistralService)
        private readonly mistralService: IMistralService,
        @inject(TYPES.IOcrResultService)
        private readonly ocrResultService: IOcrResultService,
        @inject(TYPES.FileRepository)
        private readonly fileRepository: Repository<FileEntity>,
        @inject(TYPES.StudentRepository)
        private readonly studentRepository: Repository<StudentEntity>,
        @inject(TYPES.OcrResultRepository)
        private readonly ocrResultRepository: Repository<OcrResultEntity>,
        @inject(TYPES.TranscriptRepository)
        private readonly transcriptRepository: Repository<TranscriptEntity>,
        @inject(TYPES.TranscriptSubjectRepository)
        private readonly transcriptSubjectRepository: Repository<TranscriptSubjectEntity>,
        @inject(TYPES.UserRepository)
        private readonly userRepository: Repository<UserEntity>,
        @inject(TYPES.IOcrEventListener)
        private readonly ocrEventListener: IOcrEventListener,
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

    /**
     * Check if we should trigger L3 prediction based on completed OCR results
     * Triggers when we have exactly 3 or 6 completed OCR results
     */
    private async checkAndEmitOcrCreatedEvent(
        studentId: string,
        userId?: string,
    ): Promise<void> {
        try {
            // Get all completed OCR results for this student
            const completedOcrResults = await this.ocrResultRepository.find({
                where: {
                    status: OcrStatus.COMPLETED,
                    studentId,
                },
            });

            const completedCount = completedOcrResults.length;

            this.logger.debug("Checking OCR completion threshold", {
                completedCount,
                studentId,
            });

            // Check if we have exactly 3 or 6 completed results
            if (completedCount === 3 || completedCount === 6) {
                const ocrResultIds = completedOcrResults.map((ocr) => ocr.id);

                const ocrCreatedEvent: OcrCreatedEvent = {
                    ocrResultIds,
                    studentId,
                    userId,
                };

                // Publish event to trigger L3 prediction
                this.ocrEventListener
                    .handleOcrCreatedEvent(ocrCreatedEvent)
                    .catch((error: unknown) => {
                        this.logger.error(
                            "Failed to handle OCR created event in background",
                            {
                                error,
                                ocrResultIds,
                                studentId,
                                userId,
                            },
                        );
                    });

                this.logger.info(
                    "Emitted OCR created event for L3 prediction",
                    {
                        completedCount,
                        ocrResultIds,
                        studentId,
                        userId,
                    },
                );
            } else {
                this.logger.debug("OCR completion threshold not met", {
                    completedCount,
                    requiredCount: "3 or 6",
                    studentId,
                });
            }
        } catch (error) {
            this.logger.error("Error checking OCR completion threshold", {
                error,
                studentId,
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

            let createdBy: string = Role.ANONYMOUS;
            let userEntity: null | UserEntity = null;

            if (userId) {
                userEntity = await this.userRepository.findOne({
                    where: { id: userId },
                });

                if (userEntity) {
                    createdBy = userEntity.email;
                }
            }

            // Filter files to only those requested in the payload
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
                    createdBy,
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
            const updatedOcrResultEntities: OcrResultEntity[] =
                await this.ocrResultService.updateResults(
                    initialOcrResults,
                    batchExtractionResult,
                    processingStartTime,
                );

            this.logger.info(
                `Batch OCR processing completed for student ${studentId}. Processed ${initialOcrResults.length.toString()} files.`,
            );

            if (updatedOcrResultEntities.length > 0) {
                for (const ocrResultEntity of updatedOcrResultEntities) {
                    if (
                        ocrResultEntity.scores &&
                        ocrResultEntity.scores.length > 0
                    ) {
                        const file = filesToProcess.find(
                            (f) => f.id === ocrResultEntity.fileId,
                        );

                        if (!file || file.studentId !== studentId) {
                            this.logger.error(
                                `Data integrity error: File ${ocrResultEntity.fileId} does not belong to student ${studentId}`,
                            );
                            continue;
                        }

                        const transcriptEntity: TranscriptEntity =
                            this.transcriptRepository.create({
                                createdBy: createdBy,
                                ocrResult: ocrResultEntity,
                                student: student,
                                studentId: studentId,
                            });

                        const transcriptSubjectEntities: TranscriptSubjectEntity[] =
                            ocrResultEntity.scores.map((subjectScore) => {
                                const transcriptSubjectEntity: TranscriptSubjectEntity =
                                    this.transcriptSubjectRepository.create({
                                        createdBy: createdBy,
                                        score: subjectScore.score,
                                        subject: subjectScore.name,
                                    });
                                return transcriptSubjectEntity;
                            });

                        transcriptEntity.transcriptSubjects =
                            transcriptSubjectEntities;

                        const savedTranscriptEntity: TranscriptEntity =
                            await this.transcriptRepository.save(
                                transcriptEntity,
                            );

                        this.logger.info(
                            `Saved TranscriptEntity with id ${savedTranscriptEntity.id} for file ${ocrResultEntity.fileId}`,
                        );
                    }
                }
                await this.checkAndEmitOcrCreatedEvent(studentId, userId);
            } else {
                this.logger.warn("No Updated OCR Results to create Transcript");
            }
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

            let createdBy: string = Role.ANONYMOUS;
            if (payload.userId) {
                const userEntity: null | UserEntity =
                    await this.userRepository.findOne({
                        where: { id: payload.userId },
                    });

                if (userEntity) {
                    createdBy = userEntity.email;
                }
            }

            initialOcrResults =
                await this.ocrResultService.createInitialOcrResults(
                    payload.studentId,
                    createdBy,
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
                    file.id,
                    payload.userId,
                );

            const batchResult: BatchScoreExtractionResult = {
                error: fileExtractionResult.error,
                ocrModel: "mistral-ocr-latest",
                results: [fileExtractionResult],
                success: fileExtractionResult.success,
            };

            const updatedOcrResults = await this.ocrResultService.updateResults(
                initialOcrResults,
                batchResult,
                processingStartTime,
            );

            this.logger.info(
                `OCR processing completed for file ${payload.fileId} of student ${payload.studentId}.`,
            );

            if (updatedOcrResults.length > 0) {
                await this.checkAndEmitOcrCreatedEvent(
                    payload.studentId,
                    payload.userId,
                );
            }
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
