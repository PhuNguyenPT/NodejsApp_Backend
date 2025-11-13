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
     * Language score component for VNUHCM exam
     * Only present when examType is VNUHCM
     * @example 350
     * @range [0, 400]
     */
    @Expose()
    languageScore?: number;

    /**
     * Math score component for VNUHCM exam
     * Only present when examType is VNUHCM
     * @example 200
     * @range [0, 300]
     */
    @Expose()
    mathScore?: number;

    /**
     * Science & Logic score component for VNUHCM exam
     * Only present when examType is VNUHCM
     * @example 150
     * @range [0, 500]
     */
    @Expose()
    scienceLogic?: number;

    /**
     * Numeric score for the aptitude test
     * @example 700
     */
    @Expose()
    @Transform(({ value }) => parseInt(String(value)))
    score!: number;
}
