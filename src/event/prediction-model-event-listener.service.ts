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
import { StudentAdmissionEntity } from "@/entity/student-admission.entity.js";
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
            const admissionCodeMap = new Map<string, boolean>();

            l1PredictionResults.forEach((result) => {
                const admissionCodes = Object.keys(result.ma_xet_tuyen);
                admissionCodes.forEach((code) =>
                    admissionCodeMap.set(code, true),
                );
            });

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

            // Step 1: Find all candidate admissions from the prediction codes
            const candidateAdmissions: AdmissionEntity[] = await manager.find(
                AdmissionEntity,
                { where: { admissionCode: In(admissionCodes) } },
            );

            if (candidateAdmissions.length === 0) {
                this.logger.warn(
                    "No matching admissions found for any prediction codes",
                    { studentId },
                );
                return;
            }

            // Step 2: Find all existing admission links for this student
            const existingStudentAdmissions = await manager.findBy(
                StudentAdmissionEntity,
                { studentId },
            );
            const existingAdmissionIds = new Set(
                existingStudentAdmissions.map((sa) => sa.admissionId),
            );

            // Step 3: Filter out admissions that are already associated with the student
            const newAdmissionsToAdd = candidateAdmissions.filter(
                (admission) => !existingAdmissionIds.has(admission.id),
            );

            if (newAdmissionsToAdd.length === 0) {
                this.logger.info(
                    "No new admissions to add (all predicted admissions already associated)",
                    {
                        studentId,
                        totalAdmissions: existingAdmissionIds.size,
                    },
                );
                return;
            }

            // Step 4: Create new StudentAdmissionEntity instances for the new links
            const newStudentAdmissionLinks = newAdmissionsToAdd.map(
                (admission) =>
                    manager.create(StudentAdmissionEntity, {
                        admissionId: admission.id,
                        studentId: studentId,
                    }),
            );

            // Step 5: Save the new links to the database in a single bulk operation
            await manager.save(newStudentAdmissionLinks);

            this.logger.info(
                "Successfully created new student admission links",
                {
                    newAdmissionsAdded: newStudentAdmissionLinks.length,
                    studentId,
                    totalAdmissions:
                        existingAdmissionIds.size +
                        newStudentAdmissionLinks.length,
                },
            );
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
