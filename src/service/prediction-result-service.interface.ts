import { PredictionResultEntity } from "@/entity/uni_guide/prediction-result.entity.js";

export interface IPredictionResultService {
    findByStudentIdAndUserId(
        studentId: string,
        userId?: string,
    ): Promise<PredictionResultEntity>;
    getPredictionResultEntityByStudentIdAndUserId(
        studentId: string,
        userId?: string,
    ): Promise<PredictionResultEntity>;
}
