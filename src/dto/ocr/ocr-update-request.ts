import { Expose } from "class-transformer";
import { IsArray } from "class-validator";

import { SubjectScore } from "../predict/ocr.js";

export class OcrUpdateRequest {
    @Expose()
    @IsArray()
    subjectScores?: SubjectScore[];
}
