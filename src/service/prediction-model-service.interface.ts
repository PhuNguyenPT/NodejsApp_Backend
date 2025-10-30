import {
    L1PredictResult,
    L2PredictResult,
    UserInputL2,
} from "@/dto/predict/predict.js";
import { StudentInfoDTO } from "@/dto/student/student-dto.js";

import { ExamScenario } from "./impl/prediction-model.service.js";

export interface IPredictionModelService {
    collectExamScenarios(studentInfoDTO: StudentInfoDTO): ExamScenario[];
    getL1PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L1PredictResult[]>;
    getL2PredictResults(
        studentId: string,
        userId?: string,
    ): Promise<L2PredictResult[]>;
    predictMajorsByStudentIdAndUserId(
        userInput: UserInputL2,
        studentId: string,
        userId: string,
    ): Promise<L2PredictResult[]>;
}
