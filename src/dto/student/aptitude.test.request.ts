import { Expose } from "class-transformer";
import { IsNotEmpty, Validate } from "class-validator";

import { IsValidExamScoreConstraint } from "@/decorator/is.valid.aptitude.test.score.decorator.js";
import { ExamType } from "@/type/enum/exam.js";

/**
 * DTO for aptitude test information containing both type and score
 * @example
 * {
 *   "examType": {
 *     "type": "DGNL",
 *     "value": "VNUHCM"
 *   },
 *   "score": 700
 * }
 */
export class AptitudeTestRequest {
    /**
     * Type of exam/aptitude test
     * @example { "type": "DGNL", "value": "VNUHCM" }
     */
    @Expose()
    @IsNotEmpty({ message: "Exam type is required" })
    examType!: ExamType;

    /**
     * Numeric score for the aptitude test
     * @example 700
     */
    @Expose()
    @IsNotEmpty({ message: "Aptitude test score is required" })
    @Validate(IsValidExamScoreConstraint)
    score!: number;
}
