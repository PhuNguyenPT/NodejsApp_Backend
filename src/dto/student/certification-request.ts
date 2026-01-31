import { Expose } from "class-transformer";
import {
    IsEnum,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
    Validate,
} from "class-validator";

import {
    type CCNNType,
    type CCQTType,
    CertificationExamTypeEnum,
} from "@/type/enum/exam-type.enum.js";
import { IsValidExamLevelConstraint } from "@/validator/is-valid-exam-level.validator.js";

/**
 * Data Transfer Object for Certification information
 * @example
 * {
 *   "examType": "IELTS",
 *   "level": "6.5"
 * }
 */
export class CertificationRequest {
    /**
     * Type and category of the exam/certification
     * @example "IELTS"
     */
    @Expose()
    @IsEnum(CertificationExamTypeEnum)
    @IsNotEmpty({ message: "Exam type is required" })
    examType!: CCNNType | CCQTType;

    @Expose()
    @IsNotEmpty({ message: "Level is required" })
    @IsString({ message: "Level must be a string" })
    @MaxLength(50, { message: "Level cannot exceed 50 characters" })
    @MinLength(1, { message: "Level must be at least 1 character long" })
    @Validate(IsValidExamLevelConstraint)
    level!: string;
}
