import { Expose, Type } from "class-transformer";
import { IsEnum, IsNumber, Max, Min } from "class-validator";

import type { ISubjectScore } from "@/dto/ocr/subject-score.interface.js";

import { TranscriptSubject } from "@/type/enum/transcript-subject.js";

export class SubjectScore implements ISubjectScore {
    @Expose()
    @IsEnum(TranscriptSubject)
    name!: TranscriptSubject;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @Type(() => Number)
    score!: number;
}
