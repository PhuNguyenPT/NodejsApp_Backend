import { Expose } from "class-transformer";
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

import { CEFR } from "@/entity/uni_guide/certification.entity.js";
import {
    type CCNNType,
    type CCQTType,
    CertificationExamTypeEnum,
} from "@/type/enum/exam-type.enum.js";

/**
 * Data Transfer Object for Certification information
 * @example
 * {
 *   "examType": "IELTS",
 *   "level": "6.5"
 * }
 */
export class CertificationDTO {
    @Expose()
    @IsOptional()
    cefr?: CEFR;

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
