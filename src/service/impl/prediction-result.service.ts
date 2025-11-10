import { inject, injectable } from "inversify";
import { Repository } from "typeorm";
import { Logger } from "winston";

import { PredictionResultEntity } from "@/entity/uni_guide/prediction-result.entity.js";
import { IPredictionResultService } from "@/service/prediction-result-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";

@injectable()
export class PredictionResultService implements IPredictionResultService {
    constructor(
        @inject(TYPES.PredictionResultEntityRepository)
        private readonly predictionResultEntityRepository: Repository<PredictionResultEntity>,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
    ) {}

    public async findByStudentIdAndUserId(
        studentId: string,
        userId?: string,
    ): Promise<PredictionResultEntity> {
        const predictionResultEntity: null | PredictionResultEntity =
            await this.predictionResultEntityRepository.findOne({
                relations: ["student"],
                where: {
                    studentId: studentId,
                },
            });

        if (!predictionResultEntity) {
            throw new EntityNotFoundException(
                `Prediction Result not found for Student Profile id ${studentId}`,
            );
        }

        const studentOwnerId = predictionResultEntity.student.userId;

        if (
            // Access is unauthorized if:
            (userId && studentOwnerId !== userId) || // 1. Authenticated user doesn't own the profile
            (!userId && studentOwnerId) // 2. Guest user tries to access an owned profile
        ) {
            throw new EntityNotFoundException(
                `Prediction Result not found for student id ${studentId}`,
            );
        }
        return predictionResultEntity;
    }
}
