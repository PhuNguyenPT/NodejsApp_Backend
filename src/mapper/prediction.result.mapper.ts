import { plainToInstance } from "class-transformer";

import { PredictionResultResponse } from "@/dto/predict/prediciton.result.response.js";
import { PredictionResultEntity } from "@/entity/prediction.result.js";

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
