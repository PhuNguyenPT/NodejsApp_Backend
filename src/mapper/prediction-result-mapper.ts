import { plainToInstance } from "class-transformer";

import { PredictionResultResponse } from "@/dto/predict/prediciton-result-response.js";
import { PredictionResultEntity } from "@/entity/uni_guide/prediction-result.entity.js";

export const PredictionResultMapper = {
    toResponse(
        predictionResultEntity: PredictionResultEntity,
    ): PredictionResultResponse {
        return plainToInstance(
            PredictionResultResponse,
            predictionResultEntity,
            {
                excludeExtraneousValues: true,
            },
        );
    },
};
