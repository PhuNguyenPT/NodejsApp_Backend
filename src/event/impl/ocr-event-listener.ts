import { inject, injectable } from "inversify";
import { DataSource, EntityManager, IsNull } from "typeorm";
import { Logger } from "winston";

import { L3PredictResult } from "@/dto/prediction/l3-predict-result.dto.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import {
    PredictionResultEntity,
    PredictionResultStatus,
} from "@/entity/uni_guide/prediction-result.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { IPredictionL3Service } from "@/service/prediction-L3-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";

import {
    OcrCreatedEvent,
    OcrCreatedEventSchema,
} from "../ocr-created.event.js";
import { IOcrEventListener } from "../ocr-event-listener.interface.js";

@injectable()
export class OcrEventListener implements IOcrEventListener {
    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.DataSource) private readonly dataSource: DataSource,
        @inject(TYPES.IPredictionL3Service)
        private readonly predictionL3Service: IPredictionL3Service,
    ) {}

    public async handleOcrCreatedEvent(event: OcrCreatedEvent): Promise<void> {
        try {
            const parsed = OcrCreatedEventSchema.safeParse(event);
            if (!parsed.success) {
                this.logger.error("Schema validation failed", {
                    errors: parsed.error.format(),
                    event,
                });
                return;
            }

            const payload = parsed.data;
            const { ocrResultIds, studentId, userId } = payload;

            this.logger.info("Processing OCR created event", {
                ocrResultIds,
                studentId,
                userId,
            });

            await this.processL3PredictionInTransaction(
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
     * Process L3 prediction within a transaction
     */
    private async processL3PredictionInTransaction(
        manager: EntityManager,
        studentId: string,
        userId?: string,
    ): Promise<void> {
        const studentEntity = await manager.findOne(StudentEntity, {
            relations: ["predictionResult", "user"],
            where: {
                id: studentId,
                userId: userId ?? IsNull(),
            },
        });

        if (!studentEntity) {
            throw new EntityNotFoundException(
                `Student profile with id: ${studentId} not found`,
            );
        }

        const userEntity: undefined | UserEntity = studentEntity.user;

        const predictionResultEntity = studentEntity.predictionResult;

        if (!predictionResultEntity) {
            this.logger.warn(
                "No existing prediction result found for L3 processing. L1/L2 must be run first.",
                {
                    studentId,
                    userId,
                },
            );
            return;
        }

        predictionResultEntity.status = PredictionResultStatus.PROCESSING;
        await manager.save(predictionResultEntity);

        this.logger.info("Updated prediction result to PROCESSING for L3", {
            predictionResultId: predictionResultEntity.id,
            studentId,
            userId,
        });

        try {
            const l3PredictionResults: L3PredictResult[] =
                await this.predictionL3Service.getL3PredictResults(
                    studentId,
                    userId,
                );

            this.logger.info("L3 prediction completed", {
                l3ResultsCount: l3PredictionResults.length,
                studentId,
            });

            await this.dataSource.transaction(
                async (txManager: EntityManager) => {
                    const predictionResult = await txManager.findOne(
                        PredictionResultEntity,
                        {
                            where: {
                                id: predictionResultEntity.id,
                            },
                        },
                    );

                    if (!predictionResult) {
                        throw new EntityNotFoundException(
                            `Prediction result with id: ${predictionResultEntity.id} not found`,
                        );
                    }

                    predictionResult.l3PredictResults = l3PredictionResults;

                    const hasL1Results: boolean =
                        predictionResult.l1PredictResults ? true : false;
                    const hasL2Results: boolean =
                        predictionResult.l2PredictResults ? true : false;
                    const hasL3Results: boolean = Array.isArray(
                        l3PredictionResults,
                    )
                        ? true
                        : false;

                    // Update status logic
                    if (hasL1Results && hasL2Results && hasL3Results) {
                        predictionResult.status =
                            PredictionResultStatus.COMPLETED;
                    } else if (hasL1Results || hasL2Results || hasL3Results) {
                        predictionResult.status =
                            PredictionResultStatus.PARTIAL;
                    } else {
                        predictionResult.status = PredictionResultStatus.FAILED;
                    }

                    predictionResult.updatedBy =
                        userEntity?.email ?? Role.ANONYMOUS;

                    await txManager.save(predictionResult);

                    this.logger.info("Updated prediction result with L3 data", {
                        l3ResultsCount: l3PredictionResults.length,
                        predictionResultId: predictionResult.id,
                        status: predictionResult.status,
                        studentId,
                    });
                },
            );
        } catch (error) {
            await this.dataSource.transaction(
                async (txManager: EntityManager) => {
                    const predictionResult = await txManager.findOne(
                        PredictionResultEntity,
                        {
                            where: {
                                id: predictionResultEntity.id,
                            },
                        },
                    );

                    if (predictionResult) {
                        predictionResult.status = PredictionResultStatus.FAILED;
                        predictionResult.updatedBy =
                            userEntity?.email ?? Role.ANONYMOUS;
                        await txManager.save(predictionResult);
                    }
                },
            );

            this.logger.error("Unexpected error in L3 prediction handling", {
                error,
                predictionResultId: predictionResultEntity.id,
                studentId,
            });

            // Re-throw to trigger proper error handling
            throw error;
        }
    }
}
