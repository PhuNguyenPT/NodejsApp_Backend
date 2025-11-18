import { Expose, Transform, Type } from "class-transformer";
import {
    IsArray,
    IsEnum,
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

import { HsgSubject } from "./hsg-subject.enum.js";
import { L3NationalSubject } from "./l3-national-subject.enum.js";

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

export class AwardEnglish {
    @Expose()
    @IsIn(["A1", "A2", "B1", "B2", "C1", "C2"])
    @IsString()
    level!: string;
}

export class AwardQG {
    @Expose()
    @IsIn([1, 2, 3, 4])
    @IsInt()
    level!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    subject!: HsgSubject;
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

export class NangKhieuScore {
    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    BIEU_DIEN_NGHE_THUAT?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    CHI_HUY_TAI_CHO?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    CHUYEN_MON_AM_NHAC?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    CHUYEN_MON_AM_NHAC_1?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    CHUYEN_MON_AM_NHAC_2?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    DOC_DIEN_CAM?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    DOC_HIEU?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    GHI_AM_XUONG_AM?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    HAT?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    HAT_BIEU_DIEN_NHAC_CU?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    HAT_MUA?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    HAT_XUONG_AM?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    HOA_THANH?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    KY_XUONG_AM?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_1?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_2?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_AM_NHAC_1?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_AM_NHAC_2?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_ANH_BAO_CHI?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_BAO_CHI?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_BIEU_DIEN_NGHE_THUAT?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_KIEN_THUC_VAN_HOA_XA_HOI_NGHE_THUAT?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_MAM_NON?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_MAM_NON_1?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_MAM_NON_2?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_QUAY_PHIM_TRUYEN_HINH?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_SKDA_1?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_SKDA_2?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_TDTT?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_THUYET_TRINH?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_VE_1?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    NANG_KHIEU_VE_2?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    PHAT_TRIEN_CHU_DE_PHO_THO?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    TU_DUY_GIAI_QUYET_NGU_VAN_DE?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    VE_HINH_HOA?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    VE_HINH_HOA_MY_THUAT?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    VE_MY_THUAT?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    VE_NANG_KHIEU?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    VE_TRANG_TRI?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    VE_TRANG_TRI_MAU?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    XAY_DUNG_KICH_BAN_SU_KIEN?: number;
}

export class THPTSubjectScore {
    @Expose()
    @IsNumber()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    score!: number;

    @Expose()
    @IsEnum(L3NationalSubject)
    subject_name!: L3NationalSubject;
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
    cong_nghe!: number;

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
