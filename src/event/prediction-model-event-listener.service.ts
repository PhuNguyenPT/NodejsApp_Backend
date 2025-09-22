import { inject, injectable } from "inversify";
import { DataSource, EntityManager, In } from "typeorm";
import { Logger } from "winston";
import z from "zod";

import {
    EventListenerService,
    RedisEventListener,
} from "@/decorator/redis-event-listener.decorator.js";
import { L1PredictResult, L2PredictResult } from "@/dto/predict/predict.js";
import { AdmissionEntity } from "@/entity/admission.entity.js";
import {
    PredictionResultEntity,
    PredictionResultStatus,
} from "@/entity/prediction-result.entity.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { UserEntity } from "@/entity/user.entity.js";
import { IPredictionModelService } from "@/service/prediction-model-service.interface.js";
// REMOVE THIS IMPORT - This is causing the circular dependency
// import { PredictionModelService } from "@/service/prediction-model.service.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.js";
import { JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS } from "@/util/jwt-options.js";

export const PREDICTION_CHANNEL = "prediction:student_created";

const StudentCreatedEventSchema = z.object({
    studentId: z.string().uuid("Invalid student ID format"),
    userId: z.string().uuid("Invalid user ID format").optional(),
});

export type StudentCreatedEvent = z.infer<typeof StudentCreatedEventSchema>;

@EventListenerService(TYPES.PredictionModelEventListenerService)
@injectable()
export class PredictionModelEventListenerService {
    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.DataSource) private readonly dataSource: DataSource,
        @inject(TYPES.IPredictionModelService)
        private readonly predictionModelService: IPredictionModelService,
    ) {}

    @RedisEventListener(PREDICTION_CHANNEL)
    private async handleStudentCreatedEvent(message: string): Promise<void> {
        try {
            const rawPayload: unknown = JSON.parse(message);
            const parsed = StudentCreatedEventSchema.safeParse(rawPayload);
            if (!parsed.success) {
                this.logger.error("Schema validation failed", {
                    errors: parsed.error.format(),
                    message,
                });
                return;
            }

            const payload = parsed.data;
            const { studentId, userId } = payload;

            // Execute everything in a transaction for consistency
            await this.dataSource.transaction(
                async (manager: EntityManager) => {
                    await this.processStudentPredictionInTransaction(
                        manager,
                        studentId,
                        userId,
                    );
                },
            );
        } catch (error) {
            this.logger.error("Error handling 'student created' message.", {
                error,
                message,
            });
        }
    }

    /**
     * Process admissions from prediction results and associate them with the student
     * Using EntityManager for transactional consistency
     */
    private async processAdmissionsFromPredictions(
        manager: EntityManager,
        studentId: string,
        l1PredictionResults: L1PredictResult[],
        l2PredictionResults: L2PredictResult[],
    ): Promise<void> {
        try {
            // Track raw counts for logging
            let l1RawCodesCount = 0;
            const l2RawCodesCount = l2PredictionResults.length;

            const admissionCodeMap = new Map<string, boolean>();

            // Add L1 codes
            l1PredictionResults.forEach((result) => {
                const admissionCodes = Object.keys(result.ma_xet_tuyen);
                l1RawCodesCount += admissionCodes.length;
                admissionCodes.forEach((code) => {
                    admissionCodeMap.set(code, true);
                });
            });

            // Add L2 codes
            l2PredictionResults.forEach((result) => {
                admissionCodeMap.set(result.ma_xet_tuyen, true);
            });

            const admissionCodes: string[] = Array.from(
                admissionCodeMap.keys(),
            );

            if (admissionCodes.length === 0) {
                this.logger.info(
                    "No prediction results to process admissions",
                    {
                        l1ResultsCount: l1PredictionResults.length,
                        l2ResultsCount: l2PredictionResults.length,
                        studentId,
                    },
                );
                return;
            }

            this.logger.info("Processing admissions from predictions", {
                admissionCodes: admissionCodes.slice(0, 10),
                admissionCodesCount: admissionCodes.length,
                duplicatesRemoved:
                    l1RawCodesCount + l2RawCodesCount - admissionCodes.length,
                l1RawCodesCount: l1RawCodesCount,
                l2RawCodesCount: l2RawCodesCount,
                studentId,
            });

            // Find admissions using transactional entity manager
            const admissions: AdmissionEntity[] = await manager.find(
                AdmissionEntity,
                {
                    where: {
                        admissionCode: In(admissionCodes),
                    },
                },
            );

            this.logger.info("Found matching admissions", {
                foundAdmissionsCount: admissions.length,
                requestedCodesCount: admissionCodes.length,
                studentId,
            });

            if (admissions.length === 0) {
                this.logger.warn(
                    "No matching admissions found for prediction codes",
                    {
                        admissionCodes: admissionCodes.slice(0, 10),
                        studentId,
                    },
                );
                return;
            }

            // Find student using transactional entity manager
            const student: null | StudentEntity = await manager.findOne(
                StudentEntity,
                {
                    relations: ["admissions"],
                    where: { id: studentId },
                },
            );

            if (!student) {
                this.logger.error(
                    "Student not found when processing admissions",
                    {
                        studentId,
                    },
                );
                return;
            }

            // Associate new admissions with the student
            let newAdmissionsCount = 0;
            admissions.forEach((admission) => {
                if (!student.hasAdmission(admission.id)) {
                    student.addAdmission(admission);
                    newAdmissionsCount++;
                }
            });

            // Save changes using transactional entity manager
            if (newAdmissionsCount > 0) {
                await manager.save(student);

                this.logger.info(
                    "Successfully associated admissions with student",
                    {
                        newAdmissionsAdded: newAdmissionsCount,
                        studentId,
                        totalAdmissions: student.getAdmissionCount(),
                    },
                );
            } else {
                this.logger.info(
                    "No new admissions to add (all already associated)",
                    {
                        studentId,
                        totalAdmissions: student.getAdmissionCount(),
                    },
                );
            }

            // Log admission details for debugging
            if (admissions.length > 0) {
                const admissionCodes = admissions.map((e) => e.admissionCode);

                this.logger.debug("Processed admission details", {
                    admissionCodes: admissionCodes.slice(0, 5),
                    processedAdmissionsCount: admissions.length,
                    studentId,
                });
            }
        } catch (error) {
            this.logger.error("Error processing admissions from predictions", {
                error,
                l1ResultsCount: l1PredictionResults.length,
                l2ResultsCount: l2PredictionResults.length,
                studentId,
            });

            // Re-throw to ensure transaction rollback
            throw error;
        }
    }

    /**
     * Process student prediction within a transaction
     */
    private async processStudentPredictionInTransaction(
        manager: EntityManager,
        studentId: string,
        userId?: string,
    ): Promise<void> {
        let userEntity: null | UserEntity = null;

        // Get user if needed (using caching for performance)
        if (userId) {
            userEntity = await manager.findOne(UserEntity, {
                cache: {
                    id: `user_cache_${userId}`,
                    milliseconds: JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS,
                },
                where: { id: userId },
            });
        }

        // Step 1: Create initial PredictionResultEntity with PROCESSING status
        const predictionResultEntity = manager.create(PredictionResultEntity, {
            createdBy: userEntity?.email ?? Role.ANONYMOUS,
            l1PredictResults: [],
            l2PredictResults: [],
            status: PredictionResultStatus.PROCESSING,
            studentId,
            userId,
        });

        const savedPredictionResult = await manager.save(
            predictionResultEntity,
        );

        this.logger.info("Created prediction result with PROCESSING status", {
            predictionResultId: savedPredictionResult.id,
            studentId,
            userId,
        });

        try {
            // Step 2: Get prediction results concurrently with individual error handling
            // Use the lazy getter here instead of the injected service
            const [l2Result, l1Result] = await Promise.allSettled([
                this.predictionModelService.getL2PredictResults(
                    studentId,
                    userId,
                ),
                this.predictionModelService.getL1PredictResults(
                    studentId,
                    userId,
                ),
            ]);

            const l2PredictionResults: L2PredictResult[] =
                l2Result.status === "fulfilled" ? l2Result.value : [];
            const l1PredictionResults: L1PredictResult[] =
                l1Result.status === "fulfilled" ? l1Result.value : [];

            // Log any individual failures
            if (l2Result.status === "rejected") {
                this.logger.error("L2 prediction failed", {
                    error: l2Result.reason as unknown,
                    studentId,
                });
            }
            if (l1Result.status === "rejected") {
                this.logger.error("L1 prediction failed", {
                    error: l1Result.reason as unknown,
                    studentId,
                });
            }

            // Step 3: Update with results first (even if some are empty due to failures)
            savedPredictionResult.l1PredictResults = l1PredictionResults;
            savedPredictionResult.l2PredictResults = l2PredictionResults;

            // Decide status based on results
            const hasL1Results = l1PredictionResults.length > 0;
            const hasL2Results = l2PredictionResults.length > 0;

            if (hasL1Results && hasL2Results) {
                savedPredictionResult.status = PredictionResultStatus.COMPLETED;
            } else if (hasL1Results || hasL2Results) {
                savedPredictionResult.status = PredictionResultStatus.PARTIAL;
            } else {
                savedPredictionResult.status = PredictionResultStatus.FAILED;
            }

            await manager.save(savedPredictionResult);

            // Step 4: Process admissions from predictions after saving results
            await this.processAdmissionsFromPredictions(
                manager,
                studentId,
                l1PredictionResults,
                l2PredictionResults,
            );

            this.logger.info("Updated prediction result", {
                l1ResultsCount: l1PredictionResults.length,
                l2ResultsCount: l2PredictionResults.length,
                predictionResultId: savedPredictionResult.id,
                status: savedPredictionResult.status,
                studentId,
            });
        } catch (error) {
            // Update status to failed before re-throwing (transaction will rollback)
            savedPredictionResult.status = PredictionResultStatus.FAILED;
            await manager.save(savedPredictionResult);

            this.logger.error("Unexpected error in prediction handling", {
                error,
                predictionResultId: savedPredictionResult.id,
                studentId,
            });

            // Re-throw to trigger transaction rollback
            throw error;
        }
    }
}
