import { Expose } from "class-transformer";
import { IsNotEmpty, Validate } from "class-validator";

import { ExamType } from "@/type/enum/exam.js";
import { IsValidAptitudeExamScoreConstraint } from "@/validator/is-valid-aptitude-exam-score.validator.js";
import { IsValidDGNLExamTypeConstraint } from "@/validator/is-valid-exam-type.validator.js";

/**
 * DTO for aptitude test information containing both type and score
 * @example
 * {
 *   "examType": "VNUHCM",
 *   "score": "700"
 * }
 */

export class AptitudeExamRequest {
    /**
     * Type of exam/aptitude test
     * @example "VNUHCM"
     */
    @Expose()
    @IsNotEmpty({ message: "Exam type is required" })
    @Validate(IsValidDGNLExamTypeConstraint)
    examType!: ExamType;

    /**
     * Numeric score for the aptitude test
     * @example 700
     */
    @Expose()
    @IsNotEmpty({ message: "Aptitude test score is required" })
    @Validate(IsValidAptitudeExamScoreConstraint)
    score!: number;
}
