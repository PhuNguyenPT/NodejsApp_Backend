import { Expose } from "class-transformer";
import { IsNumber, IsOptional, Max, Min } from "class-validator";

import { ToTwoDecimals } from "../../transformer/to-two-decimals.decorator.js";

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
