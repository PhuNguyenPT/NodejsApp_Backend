import { Expose } from "class-transformer";
import { IsInt, IsNotEmpty, Max, Min, Validate } from "class-validator";

import { ExamType } from "@/type/enum/exam.js";
import { IsValidDGNLExamTypeConstraint } from "@/validator/is-valid-exam-type.validator.js";

/**
 * DTO for aptitude test information containing both type and score
 */
export class AptitudeTestDTO {
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
    @IsInt({ message: "Score must be an integer" })
    @IsNotEmpty({ message: "Aptitude test score is required" })
    @Max(1200, { message: "Score cannot exceed 1200" })
    @Min(0, { message: "Score must be at least 0" })
    score!: number;
}
