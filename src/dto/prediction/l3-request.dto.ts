import { Expose, Transform, Type } from "class-transformer";
import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from "class-validator";

import { MajorGroupCodes } from "@/type/enum/major.js";

const ToTwoDecimals = () =>
    Transform(({ value }: { value: unknown }) => {
        if (value === null || value === undefined) return value;
        if (typeof value === "number") return Math.round(value * 100) / 100;
        if (typeof value === "string") {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? value : Math.round(parsed * 100) / 100;
        }
        return value;
    });

export class AwardQG {
    @Expose()
    @IsIn([1, 2, 3, 4])
    @IsInt()
    level!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    subject!: string;
}

export class DGNL {
    @Expose()
    @IsInt()
    @Max(400)
    @Min(0)
    language_score!: number;

    @Expose()
    @IsInt()
    @Max(300)
    @Min(0)
    math_score!: number;

    @Expose()
    @IsInt()
    @Max(500)
    @Min(0)
    science_logic!: number;
}

export class InterCer {
    @Expose()
    @IsNotEmpty()
    @IsString()
    name!: string;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    score!: number;
}

export class NangKhieuKhoiM {
    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    doc_dien_cam?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    hat?: number;
}

export class NangKhieuKhoiN {
    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    hat_hoac_bieu_dien_nhac_cu?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    ky_xuong_am?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    nang_khieu_am_nhac_1?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    nang_khieu_am_nhac_2?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    nang_khieu_chung?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    xay_dung_kich_ban_su_kien?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    xuong_am?: number;
}

export class NangKhieuKhoiT {
    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    tdtt?: number;
}

export class NangKhieuScore {
    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    doc_dien_cam?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    hat?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    hat_mua?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    nang_khieu_bao_chi?: number;

    @Expose()
    @IsOptional()
    @Type(() => NangKhieuKhoiM)
    @ValidateNested()
    nang_khieu_M?: NangKhieuKhoiM;

    @Expose()
    @IsOptional()
    @Type(() => NangKhieuKhoiN)
    @ValidateNested()
    nang_khieu_N?: NangKhieuKhoiN;

    @Expose()
    @IsOptional()
    @Type(() => NangKhieuKhoiT)
    @ValidateNested()
    nang_khieu_T?: NangKhieuKhoiT;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    ve_dt?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    ve_nk?: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    ve_tt?: number;
}

export class THPTSubjectScore {
    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    score!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    subject_name!: string;
}

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

export class TranscriptRecordL3 {
    @Expose()
    @IsNotEmpty()
    @Type(() => TranscriptSubjectScoreL3)
    @ValidateNested()
    grade_10!: TranscriptSubjectScoreL3;

    @Expose()
    @IsNotEmpty()
    @Type(() => TranscriptSubjectScoreL3)
    @ValidateNested()
    grade_11!: TranscriptSubjectScoreL3;

    @Expose()
    @IsNotEmpty()
    @Type(() => TranscriptSubjectScoreL3)
    @ValidateNested()
    grade_12!: TranscriptSubjectScoreL3;
}

export class TranscriptSubjectScoreL3 {
    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    anh!: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    cong_nghe_cong_nghiep!: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    dia!: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    gdkt_pl!: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    hoa!: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    ly!: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    sinh!: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    su!: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    tin!: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    toan!: number;

    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    van!: number;
}

export class UserInputL3 {
    @Expose()
    @IsIn(["A1", "A2", "B1", "B2", "C1", "C2"])
    @IsOptional()
    @IsString()
    award_english?: string;

    @Expose()
    @IsOptional()
    @Type(() => AwardQG)
    @ValidateNested()
    award_qg?: AwardQG;

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
    @Type(() => TranscriptRecordL3)
    @ValidateNested()
    hoc_ba!: TranscriptRecordL3;

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
