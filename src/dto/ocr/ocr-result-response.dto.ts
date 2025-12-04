import { Expose, Type } from "class-transformer";

import { SubjectScore } from "./subject-score.dto.js";

export class OcrResultResponse {
    @Expose()
    @Type(() => String)
    id?: string;

    @Expose()
    @Type(() => SubjectScore)
    subjectScores?: SubjectScore[];
}
