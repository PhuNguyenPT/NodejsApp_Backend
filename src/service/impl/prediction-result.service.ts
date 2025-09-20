import { inject, injectable } from "inversify";
import { IsNull, Repository } from "typeorm";
import { Logger } from "winston";

import { PredictionResultEntity } from "@/entity/prediction-result.entity.js";
import { TYPES } from "@/type/container/types.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";

@injectable()
export class PredictionResultService {
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
                where: {
                    studentId: studentId,
                    userId: userId ?? IsNull(),
                },
            });

        if (!predictionResultEntity) {
            throw new EntityNotFoundException(
                `Prediction Result not found for Student Profile id ${studentId}`,
            );
        }
        return predictionResultEntity;
    }

    public async getPredictionResultEntityByStudentIdAndUserId(
        studentId: string,
        userId?: string,
    ): Promise<PredictionResultEntity> {
        this.logger.info("Fetching Prediction Result...", {
            studentId,
            userId,
        });

        const predictionResultEntity: PredictionResultEntity =
            await this.findByStudentIdAndUserId(studentId, userId);

        this.logger.info("Prediction result found successfully", {
            resultId: predictionResultEntity.id,
            studentId,
            userId,
        });

        return predictionResultEntity;
    }
}
