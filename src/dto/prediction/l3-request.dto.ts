import { Expose, Transform, Type } from "class-transformer";
import {
    IsArray,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from "class-validator";

import { MajorGroupCodes } from "@/type/enum/major.js";

import { AwardEnglish } from "./award-english.dto.js";
import { AwardQG } from "./award-qg.dto.js";
import { DGNL } from "./dgnl.dto.js";
import { InterCer } from "./inter-cer.dto.js";
import { NangKhieuScore } from "./nang-khieu-score.dto.js";
import { TNTHPTScores } from "./tnthpt-scores.dto.js";
import { TranscriptRecord } from "./transcript-record.dto.js";

export class UserInputL3 {
    @Expose()
    @IsOptional()
    @Type(() => AwardEnglish)
    @ValidateNested()
    award_english?: AwardEnglish;

    @Expose()
    @IsArray()
    @IsOptional()
    @Type(() => AwardQG)
    @ValidateNested({ each: true })
    award_qg?: AwardQG[];

    @Expose()
    @IsIn([0, 1])
    @IsInt()
    cong_lap!: number;

    @Expose()
    @IsOptional()
    @Type(() => DGNL)
    @ValidateNested()
    dgnl?: DGNL;

    @Expose()
    @IsNotEmpty()
    @Type(() => TranscriptRecord)
    @ValidateNested()
    hoc_ba!: TranscriptRecord;

    @Expose()
    @IsInt()
    @Min(0)
    hoc_phi!: number;

    @Expose()
    @IsOptional()
    @Type(() => InterCer)
    @ValidateNested()
    int_cer?: InterCer;

    @Expose()
    @IsOptional()
    @Type(() => NangKhieuScore)
    @ValidateNested()
    nang_khieu?: NangKhieuScore;

    @Expose()
    @IsIn(MajorGroupCodes)
    @IsInt()
    nhom_nganh!: number;

    @Expose()
    @IsIn([0, 1, 2])
    @IsNumber()
    @Transform(({ value }) => {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
            const parsed = parseInt(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    })
    priority_object!: number;

    @Expose()
    @IsIn([0, 0.25, 0.75])
    @IsNumber()
    @Transform(({ value }) => {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    })
    priority_region!: number;

    @Expose()
    @IsOptional()
    @Type(() => TNTHPTScores)
    @ValidateNested()
    thpt?: TNTHPTScores;

    @Expose()
    @IsNotEmpty()
    @IsString()
    tinh_tp!: string;
}
