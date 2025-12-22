import { differenceInMilliseconds } from "date-fns";
import { inject, injectable } from "inversify";
import { In, Repository } from "typeorm";
import { Logger } from "winston";

import type {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
} from "@/dto/ocr/score-extraction-result.js";
import type { IOcrResultService } from "@/service/ocr-result-service.interface.js";

import { FileEntity } from "@/entity/uni_guide/file.entity.js";
import {
    type OcrMetadata,
    OcrResultEntity,
    OcrStatus,
} from "@/entity/uni_guide/ocr-result.entity.js";
import { TYPES } from "@/type/container/types.js";
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
        createdBy: string,
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
                                createdBy: createdBy,
                                fileId: file.id,
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
        username?: string,
    ): Promise<OcrResultEntity> {
        const ocrResultEntity: null | OcrResultEntity =
            await this.ocrResultRepository.findOne({
                transaction: true,
                where: {
                    createdBy: username ?? Role.ANONYMOUS,
                    id,
                },
            });

        if (!ocrResultEntity) {
            throw new EntityNotFoundException(
                `No OCR result found for id ${id}`,
            );
        }

        return ocrResultEntity;
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

    // Update records with final results
    public async updateResults(
        initialResults: OcrResultEntity[],
        batchExtractionResult: BatchScoreExtractionResult,
        processingStartTime: Date,
    ): Promise<OcrResultEntity[]> {
        if (initialResults.length === 0) return [];

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

        const ocrResultEntities: OcrResultEntity[] =
            await this.ocrResultRepository.save(updatedEntities);
        this.logger.info(
            `Successfully updated ${updatedEntities.length.toString()} OCR results.`,
        );

        return ocrResultEntities;
    }
}
