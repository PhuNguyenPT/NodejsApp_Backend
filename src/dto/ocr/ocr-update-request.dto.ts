import { Expose, Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";

import { SubjectScore } from "@/dto/ocr/ocr.dto.js";

export class OcrUpdateRequest {
    @Expose()
    @IsArray()
    @Type(() => SubjectScore)
    @ValidateNested({ each: true })
    subjectScores?: SubjectScore[];
}
