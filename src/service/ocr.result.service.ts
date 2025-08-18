import { differenceInMilliseconds } from "date-fns";
import { inject, injectable } from "inversify";
import { In, Repository } from "typeorm";

import {
    BatchScoreExtractionResult,
    FileScoreExtractionResult,
} from "@/dto/predict/ocr.js";
import { FileEntity } from "@/entity/file.js";
import {
    OcrMetadata,
    OcrResultEntity,
    OcrStatus,
} from "@/entity/ocr.result.entity.js";
import { TYPES } from "@/type/container/types.js";
import { ILogger } from "@/type/interface/logger.js";

@injectable()
export class OcrResultService {
    constructor(
        @inject(TYPES.OcrResultRepository)
        private readonly ocrResultRepository: Repository<OcrResultEntity>,
        @inject(TYPES.Logger)
        private readonly logger: ILogger,
    ) {}

    // Create placeholder records only for files that don't already have results
    public async createInitialOcrResults(
        studentId: string,
        userId: string,
        files: FileEntity[],
    ): Promise<OcrResultEntity[]> {
        const fileIds = files.map((f) => f.id);
        const existingResults = await this.findExistingResults(fileIds);
        const existingFileIds = new Set(existingResults.map((r) => r.fileId));

        // Filter out files that already have results
        const filesToProcess = files.filter(
            (file) => !existingFileIds.has(file.id),
        );

        if (filesToProcess.length === 0) {
            this.logger.warn(
                `All files already have OCR results for student ${studentId}. No new records created.`,
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

        const savedEntities =
            await this.ocrResultRepository.save(initialEntities);
        this.logger.info(
            `Created ${savedEntities.length.toString()} new placeholder OCR records for student ${studentId}. Skipped ${existingFileIds.size.toString()} files with existing results.`,
        );
        return savedEntities;
    }

    public async findByFileId(fileId: string): Promise<null | OcrResultEntity> {
        return await this.ocrResultRepository.findOne({
            where: { fileId },
        });
    }

    public async findExistingResults(
        fileIds: string[],
    ): Promise<OcrResultEntity[]> {
        if (fileIds.length === 0) return [];

        return await this.ocrResultRepository.find({
            where: { fileId: In(fileIds) },
        });
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
