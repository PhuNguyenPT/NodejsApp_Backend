import { UserInputL1 } from "@/dto/prediction/l1-request.dto.js";
import { L1PredictResult } from "@/dto/prediction/l1-response.dto.js";
import { StudentInfoDTO } from "@/dto/student/student-dto.js";

export interface IPredictionL1Service {
    combineL1Results(results: L1PredictResult[]): L1PredictResult[];
    executeL1PredictionsWithRetry(
        userInputs: UserInputL1[],
        maxChunkSize: number,
    ): Promise<L1PredictResult[]>;
    generateUserInputL1Combinations(
        studentInfoDTO: StudentInfoDTO,
    ): UserInputL1[];
    getL1PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L1PredictResult[]>;
    getL1PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L1PredictResult[]>;
    predictMajorsL1(userInput: UserInputL1): Promise<L1PredictResult[]>;
    predictMajorsL1Batch(
        userInputs: UserInputL1[],
        dynamicConcurrency?: number,
    ): Promise<L1PredictResult[]>;
}
