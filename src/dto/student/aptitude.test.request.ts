import { Expose } from "class-transformer";
import { IsNotEmpty, Validate } from "class-validator";

import { ExamType } from "@/type/enum/exam.js";
import { IsValidAptitudeTestScoreConstraint } from "@/validator/is.valid.aptitude.test.score.validator.js";
import { IsValidDGNLExamTypeConstraint } from "@/validator/is.valid.exam.type.js";

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
    @Validate(IsValidDGNLExamTypeConstraint)
    examType!: ExamType;

    /**
     * Numeric score for the aptitude test
     * @example 700
     */
    @Expose()
    @IsNotEmpty({ message: "Aptitude test score is required" })
    @Validate(IsValidAptitudeTestScoreConstraint)
    score!: number;
}
