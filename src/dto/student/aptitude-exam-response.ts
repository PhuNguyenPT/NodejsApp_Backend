import { Expose, Transform } from "class-transformer";

import { ExamType } from "@/type/enum/exam-type.js";

export class AptitudeExamResponse {
    /**
     * Type of exam/aptitude test
     * @example "VNUHCM"
     */
    @Expose()
    examType!: ExamType;

    /**
     * Numeric score for the aptitude test
     * @example 700
     */
    @Expose()
    @Transform(({ value }) => parseInt(String(value)))
    score!: number;
}
