import { differenceInMilliseconds } from "date-fns";
import { inject, injectable } from "inversify";
import { In, Repository } from "typeorm";
import { Logger } from "winston";

import { OcrUpdateRequest } from "@/dto/ocr/ocr-update-request.js";
import {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
    SubjectScore,
} from "@/dto/predict/ocr.js";
import { FileEntity } from "@/entity/file.entity.js";
import {
    OcrMetadata,
    OcrResultEntity,
    OcrStatus,
} from "@/entity/ocr-result.entity.js";
import { IOcrResultService } from "@/service/ocr-result-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { TranscriptSubject } from "@/type/enum/transcript-subject.js";
import { Role } from "@/type/enum/user.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";

@injectable()
export class OcrResultService implements IOcrResultService {
    constructor(
        @inject(TYPES.OcrResultRepository)
        private readonly ocrResultRepository: Repository<OcrResultEntity>,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
    ) {}

    public async createInitialOcrResults(
        studentId: string,
        userId: string,
        files: FileEntity[],
    ): Promise<OcrResultEntity[]> {
        if (files.length === 0) {
            return [];
        }

        // Sort fileIds for consistent lock ordering to prevent deadlocks
        const fileIds = files.map((f) => f.id).sort();

        try {
            return await this.ocrResultRepository.manager.transaction(
                async (transactionalEntityManager) => {
                    const existingResults =
                        await transactionalEntityManager.find(OcrResultEntity, {
                            lock: { mode: "pessimistic_write" },
                            where: { fileId: In(fileIds) },
                        });

                    const existingFileIds = new Set(
                        existingResults.map((r) => r.fileId),
                    );

                    // Use original files array for processing (maintain original order)
                    const filesToProcess = files.filter(
                        (file) => !existingFileIds.has(file.id),
                    );

                    if (filesToProcess.length === 0) {
                        this.logger.warn(
                            `All ${files.length.toString()} files already have OCR results for student ${studentId}. No new records created.`,
                        );
                        return [];
                    }

                    const initialEntities = filesToProcess.map(
                        (file) =>
                            new OcrResultEntity({
                                fileId: file.id,
                                processedBy: userId,
                                status: OcrStatus.PROCESSING,
                                studentId,
                            }),
                    );

                    const savedEntities = await transactionalEntityManager.save(
                        OcrResultEntity,
                        initialEntities,
                    );

                    this.logger.info(
                        `Created ${savedEntities.length.toString()} new placeholder OCR records for student ${studentId}. Skipped ${existingFileIds.size.toString()} files with existing results.`,
                    );

                    return savedEntities;
                },
            );
        } catch (error) {
            this.logger.error(
                `Transaction failed while creating OCR results for student ${studentId}`,
                { error, fileCount: files.length },
            );
            throw error;
        }
    }

    public async findById(
        id: string,
        processedBy?: string,
    ): Promise<OcrResultEntity> {
        const ocrResultEntity: null | OcrResultEntity =
            await this.ocrResultRepository.findOne({
                where: {
                    id,
                    processedBy: processedBy ?? Role.ANONYMOUS,
                },
            });

        if (!ocrResultEntity) {
            throw new EntityNotFoundException(
                `No OCR result found for id ${id}`,
            );
        }

        return ocrResultEntity;
    }

    public async findByStudentId(
        studentId: string,
        userId?: string,
    ): Promise<OcrResultEntity[]> {
        const ocrResultEntities: OcrResultEntity[] =
            await this.ocrResultRepository.find({
                where: { processedBy: userId ?? Role.ANONYMOUS, studentId },
            });

        if (ocrResultEntities.length === 0) {
            throw new EntityNotFoundException(
                `No OCR results found for student id ${studentId}`,
            );
        }
        return ocrResultEntities;
    }

    // Helper for handling failures during processing
    public async markAsFailed(
        results: OcrResultEntity[],
        errorMessage: string,
        startTime: Date,
    ): Promise<void> {
        if (results.length === 0) return;

        const processingTimeMs = differenceInMilliseconds(
            new Date(),
            startTime,
        );
        results.forEach((result) => {
            result.status = OcrStatus.FAILED;
            result.errorMessage = errorMessage;
            result.metadata = {
                extractedAt: new Date(),
                failedFiles: results.length,
                ocrModel: "unknown",
                processingTimeMs,
                successfulFiles: 0,
                totalFilesProcessed: results.length,
            };
        });
        await this.ocrResultRepository.save(results);
    }

    public async patchByStudentIdAndFileId(
        id: string,
        ocrUpdateRequest: OcrUpdateRequest,
        userId?: string,
    ): Promise<OcrResultEntity> {
        const ocrResultEntity: OcrResultEntity = await this.findById(
            id,
            userId,
        );

        if (
            ocrUpdateRequest.subjectScores &&
            ocrUpdateRequest.subjectScores.length > 0
        ) {
            const newSubjectScores: SubjectScore[] =
                ocrUpdateRequest.subjectScores;

            // --- START: New Merging Logic ---

            // 1. Use a Map for efficient merging (key: subject name, value: score).
            const mergedScoresMap = new Map<TranscriptSubject, number>();

            // 2. Populate the map with existing scores first to preserve them.
            if (ocrResultEntity.scores) {
                for (const existingScore of ocrResultEntity.scores) {
                    mergedScoresMap.set(
                        existingScore.name,
                        existingScore.score,
                    );
                }
            }

            // 3. Add or update scores from the patch request.
            // The .set() method handles both adding new and updating existing keys.
            for (const newScore of newSubjectScores) {
                mergedScoresMap.set(newScore.name, newScore.score);
            }

            // 4. Convert the map back into an array of SubjectScore objects.
            const finalScores: SubjectScore[] = Array.from(
                mergedScoresMap,
                ([name, score]) => ({ name, score }),
            );

            ocrResultEntity.scores = finalScores;

            // --- END: New Merging Logic ---

            ocrResultEntity.status = OcrStatus.COMPLETED;
            ocrResultEntity.errorMessage = undefined;

            const updatedEntity =
                await this.ocrResultRepository.save(ocrResultEntity);

            this.logger.info(
                `Successfully patched OCR result id ${id}. Final score count: ${finalScores.length.toString()}`,
            );

            return updatedEntity;
        }

        this.logger.info(
            `No subject scores provided for id ${id}, returning existing OCR result without changes.`,
        );

        return ocrResultEntity;
    }

    // Update records with final results
    public async updateResults(
        initialResults: OcrResultEntity[],
        batchExtractionResult: BatchScoreExtractionResult,
        processingStartTime: Date,
    ): Promise<void> {
        if (initialResults.length === 0) return;

        const processingTimeMs = differenceInMilliseconds(
            new Date(),
            processingStartTime,
        );
        const successfulFiles = batchExtractionResult.results.filter(
            (r) => r.success,
        ).length;
        const failedFiles =
            batchExtractionResult.results.length - successfulFiles;

        const metadata: OcrMetadata = {
            extractedAt: new Date(),
            failedFiles,
            ocrModel: batchExtractionResult.ocrModel ?? "unknown",
            processingTimeMs,
            successfulFiles,
            totalFilesProcessed: batchExtractionResult.results.length,
        };

        // Create a map for quick lookups
        const resultsMap = new Map<string, FileScoreExtractionResult>(
            batchExtractionResult.results.map((r) => [r.fileId, r]),
        );

        // Update the initial entity objects with the new data
        const updatedEntities = initialResults.map((entity) => {
            const result = resultsMap.get(entity.fileId);
            if (result) {
                entity.status = result.success
                    ? OcrStatus.COMPLETED
                    : OcrStatus.FAILED;
                entity.scores =
                    result.scores.length > 0 ? result.scores : undefined;
                entity.documentAnnotation = result.documentAnnotation;
                entity.errorMessage = result.error;
                entity.metadata = metadata;
            } else {
                entity.status = OcrStatus.FAILED;
                entity.errorMessage =
                    "Processing result not found for this file.";
                entity.metadata = metadata;
            }
            return entity;
        });

        await this.ocrResultRepository.save(updatedEntities);
        this.logger.info(
            `Successfully updated ${updatedEntities.length.toString()} OCR results.`,
        );
    }
}
