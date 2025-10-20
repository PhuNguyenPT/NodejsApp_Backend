import { Expose } from "class-transformer";
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    Validate,
} from "class-validator";

import { CEFR } from "@/entity/uni_guide/certification.entity.js";
import { ExamType } from "@/type/enum/exam.js";
import { IsValidCertificationExamTypeConstraint } from "@/validator/is-valid-exam-type.validator.js";

/**
 * Data Transfer Object for Certification information
 * @example
 * {
 *   "examType": {
 *     "type": "CCNN",
 *     "value": "IELTS"
 *   },
 *   "level": "6.5"
 * }
 */
export class CertificationDTO {
    @Expose()
    @IsOptional()
    cefr?: CEFR;

    /**
     * Type and category of the exam/certification
     * @example { "type": "CCNN", "value": "IELTS" }
     */
    @Expose()
    @IsNotEmpty({ message: "Exam type is required" })
    @Validate(IsValidCertificationExamTypeConstraint)
    examType!: ExamType;

    @Expose()
    @IsNotEmpty({ message: "Level is required" })
    @IsString({ message: "Level must be a string" })
    @MaxLength(50, { message: "Level cannot exceed 50 characters" })
    @MinLength(1, { message: "Level must be at least 1 character long" })
    level!: string;

    @Expose()
    @IsOptional()
    @IsString({ message: "Certification name must be a string" })
    @MaxLength(200, {
        message: "Certification name cannot exceed 200 characters",
    })
    @MinLength(1, {
        message: "Certification name must be at least 1 character long",
    })
    name?: string;
}
