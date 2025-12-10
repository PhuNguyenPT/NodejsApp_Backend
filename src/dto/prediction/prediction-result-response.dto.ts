import { Expose, Type } from "class-transformer";

import { L1PredictResult } from "@/dto/prediction/l1-response.dto.js";
import { L2PredictResult } from "@/dto/prediction/l2-response.dto.js";
import { L3PredictResult } from "@/dto/prediction/l3-predict-result.dto.js";
import { PredictionResultStatus } from "@/entity/uni_guide/prediction-result.entity.js";

export class PredictionResultResponse {
    @Expose()
    @Type(() => String)
    id!: string;

    @Expose()
    @Type(() => L1PredictResult)
    l1PredictResults?: L1PredictResult[];

    @Expose()
    @Type(() => L2PredictResult)
    l2PredictResults?: L2PredictResult[];

    @Expose()
    @Type(() => L3PredictResult)
    l3PredictResults?: L3PredictResult[];

    @Expose()
    @Type(() => String)
    status!: PredictionResultStatus;

    @Expose()
    @Type(() => String)
    studentId!: string;
}
