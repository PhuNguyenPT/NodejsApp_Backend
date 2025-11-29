import { Expose, Type } from "class-transformer";

import { PredictionResultStatus } from "@/entity/uni_guide/prediction-result.entity.js";

import { L1PredictResult } from "./l1-response.dto.js";
import { L2PredictResult } from "./l2-response.dto.js";
import { L3PredictResult } from "./l3-predict-result.dto.js";

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
