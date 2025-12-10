import type { UserInputL2 } from "@/dto/prediction/l2-request.dto.js";
import type { L2PredictResult } from "@/dto/prediction/l2-response.dto.js";
import type { StudentInfoDTO } from "@/dto/student/student.dto.js";

export interface IPredictionL2Service {
    deduplicateByHighestScore(results: L2PredictResult[]): L2PredictResult[];
    executeL2PredictionsWithRetry(
        userInputs: UserInputL2[],
        maxChunkSize: number,
    ): Promise<L2PredictResult[]>;
    generateL2UserInputCombinations(
        studentInfoDTO: StudentInfoDTO,
    ): UserInputL2[];
    getL2PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L2PredictResult[]>;
    predictMajorsByStudentIdAndUserId(
        userInput: UserInputL2,
    ): Promise<L2PredictResult[]>;
    predictMajorsL2(userInput: UserInputL2): Promise<L2PredictResult[]>;
    predictMajorsL2Batch(
        userInputs: UserInputL2[],
        dynamicConcurrency?: number,
    ): Promise<L2PredictResult[]>;
}
