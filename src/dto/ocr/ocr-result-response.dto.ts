import { Expose, Type } from "class-transformer";

import { SubjectScore } from "./subject-score.dto.js";

export class OcrResultResponse {
    /**
     * @example 10
     */
    @Expose()
    @Type(() => Number)
    grade!: number;

    @Expose()
    @Type(() => String)
    id!: string;

    /**
     * @example 1
     */
    @Expose()
    @Type(() => Number)
    semester!: number;

    @Expose()
    @Type(() => SubjectScore)
    subjectScores!: SubjectScore[];
}
