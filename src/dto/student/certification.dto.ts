import { Expose } from "class-transformer";
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

import { CEFR } from "@/entity/certification.js";
import { ExamType } from "@/type/enum/exam.js";

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
 * @example
 * {
 *   "examType": {
 *     "type": "CCQT",
 *     "value": "SAT"
 *   },
 *   "credentialId": "SAT-2023-XYZ789",
 *   "expirationDate": "2026-12-31",
 *   "issueDate": "2023-01-15",
 *   "issuingOrganization": "College Board",
 *   "level": "1450",
 *   "levelDescription": "Total Score",
 *   "name": "SAT Reasoning Test"
 * }
 * @example
 * {
 *   "examType": {
 *     "type": "DGNL",
 *     "value": "DHQG_TPHCM"
 *   },
 *   "issueDate": "2023-03-01",
 *   "expirationDate": "2024-03-01",
 *   "level": "700",
 *   "name": "Đánh giá năng lực ĐHQG TP.HCM"
 * }
 */
export class CertificationDTO {
    // @Expose()
    // @IsOptional()
    // @IsString({ message: "Credential ID must be a string" })
    // @MaxLength(100, { message: "Credential ID cannot exceed 100 characters" })
    // credentialId?: string;

    @Expose()
    @IsOptional()
    cefr?: CEFR;

    /**
     * Type and category of the exam/certification
     * @example { "type": "CCNN", "value": "IELTS" }
     */
    @Expose()
    @IsNotEmpty({ message: "Exam type is required" })
    examType!: ExamType;

    // @Expose()
    // @IsDate({ message: "Expiration date must be a valid date" })
    // @IsOptional()
    // @Type(() => Date)
    // expirationDate?: Date;

    // @Expose()
    // @IsDate({ message: "Issue date must be a valid date" })
    // @IsOptional()
    // @Type(() => Date)
    // issueDate?: Date;

    // @Expose()
    // @IsOptional()
    // @IsString({ message: "Issuing organization must be a string" })
    // @MaxLength(200, {
    //     message: "Issuing organization cannot exceed 200 characters",
    // })
    // @MinLength(1, {
    //     message: "Issuing organization must be at least 1 character long",
    // })
    // issuingOrganization?: string;

    @Expose()
    @IsNotEmpty({ message: "Level is required" })
    @IsString({ message: "Level must be a string" })
    @MaxLength(50, { message: "Level cannot exceed 50 characters" })
    @MinLength(1, { message: "Level must be at least 1 character long" })
    level!: string;

    // @Expose()
    // @IsOptional()
    // @IsString({ message: "Level description must be a string" })
    // @MaxLength(100, {
    //     message: "Level description cannot exceed 100 characters",
    // })
    // levelDescription?: string;

    // @Expose()
    // @IsOptional()
    // @IsString({ message: "Certification name must be a string" })
    // @MaxLength(200, {
    //     message: "Certification name cannot exceed 200 characters",
    // })
    // @MinLength(1, {
    //     message: "Certification name must be at least 1 character long",
    // })
    // name?: string;
}
