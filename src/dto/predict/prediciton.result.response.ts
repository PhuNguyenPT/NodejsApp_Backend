import { Expose, Type } from "class-transformer";

import { L1PredictResult, L2PredictResult } from "@/dto/predict/predict.js";

export class PredictionResultResponse {
    @Expose()
    @Type(() => String)
    id!: string;

    @Expose()
    @Type(() => L1PredictResult)
    l1PredictResults!: L1PredictResult[];

    @Expose()
    @Type(() => L2PredictResult)
    l2PredictResults!: L2PredictResult[];

    @Expose()
    @Type(() => String)
    studentId!: string;

    @Expose()
    @Type(() => String)
    userId?: string;
}
