import { Expose, Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";

import { SubjectScore } from "@/dto/predict/ocr.js";

export class OcrUpdateRequest {
    @Expose()
    @IsArray()
    @Type(() => SubjectScore)
    @ValidateNested({ each: true })
    subjectScores?: SubjectScore[];
}
