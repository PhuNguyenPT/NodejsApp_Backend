import { Expose, Type } from "class-transformer";
import { IsNotEmpty, ValidateNested } from "class-validator";

import { THPTSubjectScore } from "./thpt-subject-score.dto.js";

export class TNTHPTScores {
    @Expose()
    @IsNotEmpty()
    @Type(() => THPTSubjectScore)
    @ValidateNested()
    elective_1_score!: THPTSubjectScore;

    @Expose()
    @IsNotEmpty()
    @Type(() => THPTSubjectScore)
    @ValidateNested()
    elective_2_score!: THPTSubjectScore;

    @Expose()
    @IsNotEmpty()
    @Type(() => THPTSubjectScore)
    @ValidateNested()
    literature_score!: THPTSubjectScore;

    @Expose()
    @IsNotEmpty()
    @Type(() => THPTSubjectScore)
    @ValidateNested()
    math_score!: THPTSubjectScore;
}
