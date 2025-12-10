import { Expose, Type } from "class-transformer";
import { IsNotEmpty, ValidateNested } from "class-validator";

import { TranscriptSubjectScore } from "@/dto/prediction/transcript-subject-score.dto.js";

export class TranscriptRecord {
    @Expose()
    @IsNotEmpty()
    @Type(() => TranscriptSubjectScore)
    @ValidateNested()
    grade_10!: TranscriptSubjectScore;

    @Expose()
    @IsNotEmpty()
    @Type(() => TranscriptSubjectScore)
    @ValidateNested()
    grade_11!: TranscriptSubjectScore;

    @Expose()
    @IsNotEmpty()
    @Type(() => TranscriptSubjectScore)
    @ValidateNested()
    grade_12!: TranscriptSubjectScore;
}
