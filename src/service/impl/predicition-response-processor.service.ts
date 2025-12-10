import { inject, injectable } from "inversify";
import { DataSource, EntityManager, IsNull } from "typeorm";
import { Logger } from "winston";

import { L3PredictResult } from "@/dto/prediction/l3-predict-result.dto.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { AdmissionEntity } from "@/entity/uni_guide/admission.entity.js";
import {
    PredictionResultEntity,
    PredictionResultStatus,
} from "@/entity/uni_guide/prediction-result.entity.js";
import { StudentAdmissionEntity } from "@/entity/uni_guide/student-admission.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { IPredictionL3Service } from "@/service/prediction-L3-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { Role } from "@/type/enum/user.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";

import { IPredictionL3ProcessorService } from "../prediction-response-processor-service.interface.js";

@injectable()
export class PredictionL3ProcessorService
    implements IPredictionL3ProcessorService
{
    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.DataSource) private readonly dataSource: DataSource,
        @inject(TYPES.IPredictionL3Service)
        private readonly predictionL3Service: IPredictionL3Service,
    ) {}

    /**
     * Process L3 prediction within a transaction
     */
    public async processL3PredictionInTransaction(
        manager: EntityManager,
        studentId: string,
        userId?: string,
    ): Promise<void> {
        const studentEntity = await manager.findOne(StudentEntity, {
            relations: ["predictionResult", "user", "studentAdmissions"],
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

            const existingAdmissionIds: Set<string> = new Set<string>(
                studentEntity.studentAdmissions?.map((sa) => sa.admissionId) ??
                    [],
            );

            const l3AdmissionIds = new Set<string>();
            for (const result of l3PredictionResults) {
                for (const items of Object.values(result.result)) {
                    for (const item of items) {
                        l3AdmissionIds.add(item.id);
                    }
                }
            }

            const newAdmissionIds = Array.from(l3AdmissionIds).filter(
                (id) => !existingAdmissionIds.has(id),
            );

            this.logger.info("Admission IDs analysis", {
                existingCount: existingAdmissionIds.size,
                l3Count: l3AdmissionIds.size,
                newAdmissionIds,
                newToAddCount: newAdmissionIds.length,
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

                    if (newAdmissionIds.length > 0) {
                        const validAdmissions = await txManager.find(
                            AdmissionEntity,
                            {
                                select: ["id"],
                                where: newAdmissionIds.map((id) => ({ id })),
                            },
                        );

                        const validAdmissionIdSet = new Set(
                            validAdmissions.map((a) => a.id),
                        );

                        const invalidIds = newAdmissionIds.filter(
                            (id) => !validAdmissionIdSet.has(id),
                        );

                        if (invalidIds.length > 0) {
                            this.logger.warn(
                                "Some admission IDs from L3 results do not exist in AdmissionEntity",
                                {
                                    invalidIds,
                                    studentId,
                                },
                            );
                        }

                        const studentAdmissionsToCreate = Array.from(
                            validAdmissionIdSet,
                        ).map((admissionId) => {
                            return new StudentAdmissionEntity({
                                admissionId: admissionId,
                                createdBy: userEntity?.email ?? Role.ANONYMOUS,
                                studentId: studentId,
                            });
                        });

                        if (studentAdmissionsToCreate.length > 0) {
                            await txManager.save(
                                StudentAdmissionEntity,
                                studentAdmissionsToCreate,
                            );

                            this.logger.info(
                                "Created new StudentAdmissionEntity records",
                                {
                                    admissionIds:
                                        Array.from(validAdmissionIdSet),
                                    count: studentAdmissionsToCreate.length,
                                    studentId,
                                },
                            );
                        }
                    }

                    this.logger.info("Updated prediction result with L3 data", {
                        l3ResultsCount: l3PredictionResults.length,
                        newStudentAdmissionsCreated: newAdmissionIds.length,
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

            throw error;
        }
    }
}
