import { Expose } from "class-transformer";
import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsNotEmptyObject,
    IsNumber,
    IsString,
} from "class-validator";

export class L3PredictionItem {
    @Expose()
    @IsArray()
    @IsNotEmpty()
    @IsString({ each: true })
    best_to_hop!: string[];

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    best_to_hop_score!: number;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    bonus_points!: number;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    diem_chuan!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    ma_nganh!: string;

    @Expose()
    @IsInt()
    @IsNotEmpty()
    nhom_nganh!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    ten_nganh!: string;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    total_score!: number;
}

export class L3PredictResult {
    @Expose()
    @IsNotEmptyObject()
    result!: Record<string, L3PredictionItem[]>;
}
