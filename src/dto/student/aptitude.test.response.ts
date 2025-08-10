import { Expose, Transform } from "class-transformer";

import { ExamType } from "@/type/enum/exam.js";

export class AptitudeTestResponse {
    /**
     * Type of exam/aptitude test
     * @example { "type": "DGNL", "value": "VNUHCM" }
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
