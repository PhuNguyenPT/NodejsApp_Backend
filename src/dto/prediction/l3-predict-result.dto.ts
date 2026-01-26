import { Expose, Type } from "class-transformer";
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
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    admission_code!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    admission_type!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    admission_type_name!: string;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    best_subject_combination_score!: number;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    best_subject_combination_total_score!: number;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    bonus_points!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    id!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    major_code!: string;

    @Expose()
    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    major_group!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    major_name!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    province!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    study_program!: string;

    @Expose()
    @IsArray()
    @IsNotEmpty()
    @IsString({ each: true })
    @Type(() => String)
    subject_combination!: string[];

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    tuition_fee!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    uni_code!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    uni_name!: string;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    uni_score!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    uni_type!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    uni_web_link!: string;
}

export class L3PredictResult {
    @Expose()
    @IsNotEmptyObject()
    result!: Record<string, L3PredictionItem[]>;
}
