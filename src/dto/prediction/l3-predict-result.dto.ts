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
    @IsNotEmpty()
    @IsString()
    admission_code!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    admission_type!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    admission_type_name!: string;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    best_subject_combination_score!: number;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    best_subject_combination_total_score!: number;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    bonus_points!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    major_code!: string;

    @Expose()
    @IsInt()
    @IsNotEmpty()
    major_group!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    major_name!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    province!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    study_program!: string;

    @Expose()
    @IsArray()
    @IsNotEmpty()
    @IsString({ each: true })
    subject_combination!: string[];

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    tuition_fee!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    uni_code!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    uni_name!: string;

    @Expose()
    @IsNotEmpty()
    @IsNumber()
    uni_score!: number;

    @Expose()
    @IsNotEmpty()
    @IsString()
    uni_type!: string;

    @Expose()
    @IsNotEmpty()
    @IsString()
    uni_web_name!: string;
}

export class L3PredictResult {
    @Expose()
    @IsNotEmptyObject()
    result!: Record<string, L3PredictionItem[]>;
}
