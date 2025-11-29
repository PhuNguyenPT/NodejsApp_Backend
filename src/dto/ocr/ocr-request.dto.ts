import { Expose, Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";

import { SubjectScore } from "./ocr.dto.js";

export class OcrRequest {
    @Expose()
    @IsArray()
    @Type(() => SubjectScore)
    @ValidateNested({ each: true })
    subjectScores?: SubjectScore[];
}
