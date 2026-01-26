import type { L3PredictResult } from "@/dto/prediction/l3-predict-result.dto.js";
import type { UserInputL3 } from "@/dto/prediction/l3-request.dto.js";
import type { UUID } from "@/type/common/uuid.type.js";

export interface IPredictionL3Service {
    getL3PredictResults(
        studentId: UUID,
        userId?: UUID,
    ): Promise<L3PredictResult[]>;
    predictMajorsL3(userInput: UserInputL3): Promise<L3PredictResult>;
    predictMajorsL3Batch(userInputs: UserInputL3[]): Promise<L3PredictResult[]>;
}
