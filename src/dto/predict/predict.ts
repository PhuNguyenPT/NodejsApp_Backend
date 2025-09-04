import { Type } from "class-transformer";
import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from "class-validator";

/**
 * HTTP validation error that wraps multiple validation issues.
 */
export class HTTPValidationError {
    @IsArray()
    @Type(() => ValidationError)
    @ValidateNested({ each: true })
    detail!: ValidationError[];
}

export class L2BatchRequest {
    items!: UserInputL2[];
}

/**
 * API Response item representing a prediction result with admission code and confidence score.
 *
 * @example
 * [
 *   {
 *     "ma_xet_tuyen": "SIU7140103THPTQG",
 *     "score": 0.9995385162588366
 *   },
 *   {
 *     "ma_xet_tuyen": "HIU7140114THPTQG",
 *     "score": 0.9992295911230948
 *   }
 * ]
 */
export class L2PredictResult {
    /**
     * Admission code (Mã xét tuyển) - unique identifier for the university program
     */
    @IsNotEmpty()
    @IsString()
    ma_xet_tuyen!: string;

    /**
     * Prediction confidence score (0-1) indicating how well the student matches this program
     */
    @IsNumber()
    score!: number;
}

/**
 * User input for prediction - contains student academic information and preferences.
 * Matches the external API request format exactly.
 *
 * @example
 * {
 *   "cong_lap": 0,
 *   "tinh_tp": "TP. Hồ Chí Minh",
 *   "to_hop_mon": "A00",
 *   "diem_chuan": 24,
 *   "hoc_phi": 10000000,
 *   "ten_ccta": "IELTS",
 *   "diem_ccta": "B2",
 *   "hk10": 1,
 *   "hk11": 1,
 *   "hk12": 1,
 *   "hl10": 1,
 *   "hl11": 1,
 *   "hl12": 1,
 *   "nhom_nganh": 714
 * }
 */
export class UserInputL2 {
    /**
     * University type: 1 for public (Công lập), 0 for private (Tư thục)
     */
    @IsInt()
    cong_lap!: number;

    /**
     * English certificate score/level (optional)
     * @example "B2", "6.5", "750"
     */
    @IsOptional()
    @IsString()
    diem_ccta?: string;

    /**
     * Actual test score or benchmark score achieved by the student
     */
    @IsNumber()
    diem_chuan!: number;

    /**
     * Average grade for grade 10: 1=Excellent (Giỏi), 2=Good (Khá), 3=Average (Trung bình), 4=Weak (Yếu)
     */
    @IsInt()
    hk10!: number;

    /**
     * Average grade for grade 11: 1=Excellent (Giỏi), 2=Good (Khá), 3=Average (Trung bình), 4=Weak (Yếu)
     */
    @IsInt()
    hk11!: number;

    /**
     * Average grade for grade 12: 1=Excellent (Giỏi), 2=Good (Khá), 3=Average (Trung bình), 4=Weak (Yếu)
     */
    @IsInt()
    hk12!: number;

    /**
     * Academic performance grade 10: 1=Excellent (Giỏi), 2=Good (Khá), 3=Average (Trung bình), 4=Weak (Yếu)
     */
    @IsInt()
    hl10!: number;

    /**
     * Academic performance grade 11: 1=Excellent (Giỏi), 2=Good (Khá), 3=Average (Trung bình), 4=Weak (Yếu)
     */
    @IsInt()
    hl11!: number;

    /**
     * Academic performance grade 12:
     * 1=Excellent (>8), 2=Above 7, 3=Good (Khá), 4=Average (Trung bình), 5=Weak (Yếu)
     */
    @IsInt()
    hl12!: number;

    /**
     * Expected tuition fee for the program (VND per year)
     * @example 10000000 (10 million VND)
     */
    @IsNumber()
    hoc_phi!: number;

    /**
     * Major group code
     * @example 714, 732
     */
    @IsInt()
    nhom_nganh!: number;

    /**
     * Name of English certificate (optional)
     * @example "IELTS", "TOEFL", "TOEIC"
     */
    @IsOptional()
    @IsString()
    ten_ccta?: string;

    /**
     * Province/City name
     * @example "TP. Hồ Chí Minh", "Hà Nội"
     */
    @IsNotEmpty()
    @IsString()
    tinh_tp!: string;

    /**
     * Subject combination code
     * @example "D01", "A00", "VNUHCM"
     */
    @IsNotEmpty()
    @IsString()
    to_hop_mon!: string;
}

/**
 * Represents a single validation error from the API.
 */
export class ValidationError {
    /**
     * Location path of the validation error in the request
     * @example ["body", "fieldName"] or ["query", 0]
     */
    @IsArray()
    loc!: (number | string)[];

    /**
     * Human-readable error message describing the validation issue
     */
    @IsString()
    msg!: string;

    /**
     * Type/category of the validation error
     * @example "value_error", "type_error", "missing"
     */
    @IsString()
    type!: string;
}
