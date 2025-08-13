import { Expose, Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

import { CEFR } from "@/entity/certification";
import { ExamType } from "@/type/enum/exam.js";

/**
 * Data Transfer Object for Certification response information
 * @example
 * {
 *   "id": "cert-uuid-123",
 *   "examType": {
 *     "type": "CCNN",
 *     "value": "IELTS"
 *   },
 *   "issueDate": "2023-01-15",
 *   "expirationDate": "2025-01-15",
 *   "level": "6.5",
 *   "name": "IELTS Academic"
 * }
 * @example
 * {
 *   "id": "cert-uuid-456",
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
 */
export class CertificationResponse {
    @Expose()
    cefr?: CEFR;

    @Expose()
    credentialId?: string;

    /**
     * Type and category of the exam/certification
     * @example { "type": "CCNN", "value": "IELTS" }
     */
    @Expose()
    examType!: ExamType;

    @Expose()
    @Type(() => Date)
    expirationDate!: Date;

    @Expose()
    @IsNotEmpty()
    id!: string;

    @Expose()
    @Type(() => Date)
    issueDate!: Date;

    @Expose()
    @IsOptional()
    issuingOrganization?: string;

    @Expose()
    @IsNotEmpty()
    level!: string;

    @Expose()
    @IsOptional()
    levelDescription?: string;

    @Expose()
    @IsOptional()
    name?: string;
}
