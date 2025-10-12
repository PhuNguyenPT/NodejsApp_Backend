import { Expose } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

import { CEFR } from "@/entity/certification.entity.js";
import { ExamType } from "@/type/enum/exam.js";

/**
 * Data Transfer Object for Certification response information
 * @example
 * {
 *   "id": "3b9fb604-f40f-4253-b188-b2fe8c78bc54",
 *   "examType": {
 *     "type": "CCNN",
 *     "value": "IELTS"
 *   },
 *   "level": "6.5"
 * }
 */
export class CertificationResponse {
    @Expose()
    cefr?: CEFR;

    /**
     * Type and category of the exam/certification
     * @example { "type": "CCNN", "value": "IELTS" }
     */
    @Expose()
    examType!: ExamType;

    @Expose()
    @IsNotEmpty()
    id!: string;

    @Expose()
    @IsNotEmpty()
    level!: string;

    @Expose()
    @IsOptional()
    name?: string;
}
