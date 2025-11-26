import { Expose } from "class-transformer";
import { IsNumber, IsOptional, Max, Min } from "class-validator";

import { ToTwoDecimals } from "@/decorator/to-two-decimals.decorator.js";

export class TranscriptSubjectScore {
    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    anh?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    cong_nghe?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    dia?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    gdkt_pl?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    hoa?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    ly?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    sinh?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    su?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    tieng_duc?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    tieng_nga?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    tieng_nhat?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    tieng_phap?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    tieng_trung?: number;

    @Expose()
    @IsNumber()
    @IsOptional()
    @Max(10)
    @Min(0)
    @ToTwoDecimals()
    tin?: number;

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
