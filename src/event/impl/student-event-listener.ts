import { inject, injectable } from "inversify";
import { RedisClientType } from "redis";
import { DataSource, EntityManager, In, IsNull } from "typeorm";
import { Logger } from "winston";

import { JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS } from "@/config/jwt.config.js";
import { L1PredictResult, L2PredictResult } from "@/dto/predict/predict.js";
import { StudentInfoDTO } from "@/dto/student/student-dto.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { AdmissionEntity } from "@/entity/uni_guide/admission.entity.js";
import {
    PredictionResultEntity,
    PredictionResultStatus,
} from "@/entity/uni_guide/prediction-result.entity.js";
import { StudentAdmissionEntity } from "@/entity/uni_guide/student-admission.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { ExamScenario } from "@/service/impl/prediction-model.service.js";
import { IPredictionModelService } from "@/service/prediction-model-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { UniType } from "@/type/enum/uni-type.js";
import { Role } from "@/type/enum/user.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { CacheKeys } from "@/util/cache-key.js";
import { validateAndTransformSync } from "@/util/validation.util.js";

import { IStudentEventListener } from "../student-event-listener.interface.js";
import {
    StudentCreatedEvent,
    StudentCreatedEventSchema,
} from "../student.event.js";

@injectable()
export class StudentEventListener implements IStudentEventListener {
    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.DataSource) private readonly dataSource: DataSource,
        @inject(TYPES.IPredictionModelService)
        private readonly predictionModelService: IPredictionModelService,
        @inject(TYPES.RedisPublisher)
        private readonly redisClient: RedisClientType,
    ) {}

    public async handleStudentCreatedEvent(
        event: StudentCreatedEvent,
    ): Promise<void> {
        try {
            const parsed = StudentCreatedEventSchema.safeParse(event);
            if (!parsed.success) {
                this.logger.error("Schema validation failed", {
                    errors: parsed.error.format(),
                    event,
                });
                return;
            }

            const payload = parsed.data;
            const { studentId, userId } = payload;

            await this.processStudentPredictionInTransaction(
                this.dataSource.manager,
                studentId,
                userId,
            );
        } catch (error) {
            this.logger.error("Error handling 'student created' event.", {
                error,
                event,
            });
        }
    }

    private filterAdmissionsByStudentInfoDTO(
        admissions: AdmissionEntity[],
        studentInfoDTO: StudentInfoDTO,
    ): AdmissionEntity[] {
        const examScenarios: ExamScenario[] =
            this.predictionModelService.collectExamScenarios(studentInfoDTO);

        const subject_combinations = new Set(
            examScenarios.map((examScenario) => examScenario.to_hop_mon),
        );

        const filteredAdmissions: AdmissionEntity[] = admissions.filter(
            (admission) =>
                this.isFilteredOutAdmission(
                    admission,
                    studentInfoDTO,
                    subject_combinations,
                ),
        );
        return filteredAdmissions;
    }

    /**
     * Invalidates admission field cache for a student
     * Called after linking new admissions to ensure fresh data
     */
    private async invalidateAdmissionCache(
        studentId: string,
        userId?: string,
    ): Promise<void> {
        const keysToInvalidate = CacheKeys.allAdmissionFieldsKeys(
            studentId,
            userId,
        );

        for (const key of keysToInvalidate) {
            try {
                const deleted = await this.redisClient.del(key);
                if (deleted > 0) {
                    this.logger.info("Invalidated cache key", {
                        key,
                        studentId,
                    });
                }
            } catch (error) {
                this.logger.error("Failed to invalidate cache key", {
                    error,
                    key,
                    studentId,
                });
            }
        }
    }

    private isFilteredOutAdmission(
        admission: AdmissionEntity,
        studentInfoDTO: StudentInfoDTO,
        subject_combinations?: Set<string>,
    ): boolean {
        const studentUniType = studentInfoDTO.uniType;
        const admissionUniType = admission.uniType.trim().toUpperCase();

        let passesSubject = true;
        if (subject_combinations) {
            passesSubject = subject_combinations.has(
                admission.subjectCombination,
            );
        }

        const passesProvince = admission.province
            .trim()
            .toUpperCase()
            .includes(studentInfoDTO.province.trim().toUpperCase());

        let passesUniType = true;
        if (studentUniType === UniType.PUBLIC) {
            if (admissionUniType.includes(UniType.PRIVATE.toUpperCase())) {
                passesUniType = false;
            }
        }

        if (studentUniType === UniType.PRIVATE) {
            if (admissionUniType.includes(UniType.PUBLIC.toUpperCase())) {
                passesUniType = false;
            }
        }

        return passesSubject && passesProvince && passesUniType;
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
        userId?: string,
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
            const existingStudentAdmissions: StudentAdmissionEntity[] =
                await manager.findBy(StudentAdmissionEntity, { studentId });
            const existingAdmissionIds = new Set(
                existingStudentAdmissions.map((sa) => sa.admissionId),
            );

            // Step 3: Filter out admissions that are already associated with the student
            let newAdmissionsToAdd: AdmissionEntity[] =
                candidateAdmissions.filter(
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

            const studentEntity: null | StudentEntity = await manager.findOneBy(
                StudentEntity,
                { id: studentId, userId: userId ?? IsNull() },
            );

            if (!studentEntity) {
                throw new EntityNotFoundException(
                    `Student profile with id: ${studentId} not found`,
                );
            }

            const studentInfoDTO: StudentInfoDTO = validateAndTransformSync(
                StudentInfoDTO,
                studentEntity,
            );

            if (studentInfoDTO.hasValidNationalExam()) {
                newAdmissionsToAdd = this.filterAdmissionsByStudentInfoDTO(
                    newAdmissionsToAdd,
                    studentInfoDTO,
                );
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
                    id: CacheKeys.user(userId),
                    milliseconds: JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS,
                },
                where: { id: userId },
            });
        }

        // Step 1: Create initial PredictionResultEntity with PROCESSING status
        // Do this OUTSIDE the main transaction to release locks quickly
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
            // Step 2: Get prediction results concurrently
            // This happens OUTSIDE any transaction - no locks held during slow API calls
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

            // Step 3: NOW wrap only the database writes in a transaction
            // This minimizes lock duration to just a few milliseconds
            await this.dataSource.transaction(
                async (txManager: EntityManager) => {
                    // Update prediction results
                    savedPredictionResult.l1PredictResults =
                        l1PredictionResults;
                    savedPredictionResult.l2PredictResults =
                        l2PredictionResults;

                    // Decide status based on results
                    const hasL1Results = l1PredictionResults.length > 0;
                    const hasL2Results = l2PredictionResults.length > 0;

                    if (hasL1Results && hasL2Results) {
                        savedPredictionResult.status =
                            PredictionResultStatus.COMPLETED;
                    } else if (hasL1Results || hasL2Results) {
                        savedPredictionResult.status =
                            PredictionResultStatus.PARTIAL;
                    } else {
                        savedPredictionResult.status =
                            PredictionResultStatus.FAILED;
                    }

                    await txManager.save(savedPredictionResult);

                    // Process admissions within the same transaction for consistency
                    await this.processAdmissionsFromPredictions(
                        txManager,
                        studentId,
                        l1PredictionResults,
                        l2PredictionResults,
                        userId,
                    );
                },
            );

            await this.invalidateAdmissionCache(studentId, userId);

            this.logger.info("Updated prediction result", {
                l1ResultsCount: l1PredictionResults.length,
                l2ResultsCount: l2PredictionResults.length,
                predictionResultId: savedPredictionResult.id,
                status: savedPredictionResult.status,
                studentId,
            });
        } catch (error) {
            // Update status to failed
            // Use a separate transaction for error handling
            await this.dataSource.transaction(
                async (txManager: EntityManager) => {
                    savedPredictionResult.status =
                        PredictionResultStatus.FAILED;
                    await txManager.save(savedPredictionResult);
                },
            );

            this.logger.error("Unexpected error in prediction handling", {
                error,
                predictionResultId: savedPredictionResult.id,
                studentId,
            });

            // Re-throw to trigger proper error handling
            throw error;
        }
    }
}
