import { L3PredictResult } from "@/dto/prediction/l3-predict-result.dto.js";
import { UserInputL3 } from "@/dto/prediction/l3-request.dto.js";

export interface IPredictionL3Service {
    getL3PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L3PredictResult[]>;
    predictMajorsL3(userInput: UserInputL3): Promise<L3PredictResult>;
    predictMajorsL3Batch(userInputs: UserInputL3[]): Promise<L3PredictResult[]>;
}
