import { Type } from "class-transformer";
import {
    IsArray,
    IsEnum,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from "class-validator";

// Define the enum for the National Excellent Student Award subjects
export enum HsgSubject {
    Anh = "Anh",
    Dia = "Địa",
    Hoa = "Hoá",
    Ly = "Lý",
    Sinh = "Sinh",
    Su = "Sử",
    Tieng_Nga = "Tiếng Nga",
    Tieng_Nhat = "Tiếng Nhật",
    Tieng_Phap = "Tiếng Pháp",
    Tieng_Trung = "Tiếng Trung",
    Tin = "Tin",
    Toan = "Toán",
    Van = "Văn",
}
/**
 * HTTP validation error that wraps multiple validation issues.
 */
export class HTTPValidationError {
    @IsArray()
    @Type(() => ValidationError)
    @ValidateNested({ each: true })
    detail!: ValidationError[];
}

/**
 * Batch request for L1 predictions - contains multiple User Inputs L1 for initial prioritization.
 */
export class L1BatchRequest {
    @IsArray()
    @Type(() => UserInputL1)
    @ValidateNested({ each: true })
    items!: UserInputL1[];
}

/**
 * API Response for L1 prediction results with priority type and admission codes with scores.
 * L1 returns results grouped by priority type (loai_uu_tien) with multiple admission codes and their scores.
 *
 * @example
 * {
 *   "loai_uu_tien": "HSG Toán",
 *   "ma_xet_tuyen": {
 *     "SPK-7140231V-Ưu Tiên": 0.08657108997612813,
 *     "SPK-7140246V-Ưu Tiên": 0.08569666015489133,
 *     "SPS-7140213-Ưu Tiên": 0.0249147897234483
 *   }
 * }
 */
export class L1PredictResult {
    /**
     * Priority type or special status category
     * @example "HSG Toán", "HSG Lý", "Không ưu tiên"
     */
    @IsNotEmpty()
    @IsString()
    loai_uu_tien!: string;

    /**
     * Object mapping admission codes to their prediction scores
     * Key: Admission code (Mã xét tuyển) - unique identifier for the university program
     * Value: Prediction confidence score (0-1) indicating how well the student matches this program
     */
    @IsNotEmpty()
    @IsObject()
    ma_xet_tuyen!: Record<string, number>;
}

/**
 * Batch request for L2 predictions - contains multiple User Inputs L2 for initial prioritization.
 */
export class L2BatchRequest {
    @IsArray()
    @Type(() => UserInputL2)
    @ValidateNested({ each: true })
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
 * User input for L1 prediction - contains high-level student information and preferences.
 * This input is used for initial prioritization and filtering of university programs.
 */
export class UserInputL1 {
    /**
     * Hero of the People's Armed Forces (Anh hùng LLVT)
     * 1: Yes, 0: No
     */
    @IsIn([0, 1])
    @IsInt()
    ahld?: number = 0;

    /**
     * University type: 1 for public (Công lập), 0 for private (Tư thục)
     */
    @IsIn([0, 1])
    @IsInt()
    cong_lap!: number;

    /**
     * Ethnic minority (Dân tộc thiểu số)
     * 1: Yes, 0: No
     */
    @IsIn([0, 1])
    @IsInt()
    dan_toc_thieu_so?: number = 0;

    /**
     * From one of the 50 poor districts (50 huyện nghèo/TNB)
     * 1: Yes, 0: No
     */
    @IsIn([0, 1])
    @IsInt()
    haimuoi_huyen_ngheo_tnb?: number = 0;

    /**
     * Expected tuition fee for the program (VND per year)
     * @example 10000000 (10 million VND)
     */
    @IsNumber()
    @Min(0)
    hoc_phi!: number;

    /**
     * National Excellent Student Award - First Prize Subject
     * @example "Toán"
     */
    @IsEnum(HsgSubject)
    @IsOptional()
    @IsString()
    hsg_1?: HsgSubject | null;

    /**
     * National Excellent Student Award - Second Prize Subject
     * @example "Lý"
     */
    @IsEnum(HsgSubject)
    @IsOptional()
    @IsString()
    hsg_2?: HsgSubject | null;

    /**
     * National Excellent Student Award - Third Prize Subject
     * @example "Tin"
     */
    @IsEnum(HsgSubject)
    @IsOptional()
    @IsString()
    hsg_3?: HsgSubject | null;

    /**
     * Major group code
     * @example 714, 732
     */
    @IsInt()
    nhom_nganh!: number;

    /**
     * Province/City name
     * @example "TP. Hồ Chí Minh", "Hà Nội"
     */
    @IsNotEmpty()
    @IsString()
    tinh_tp!: string;
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
    @IsIn([0, 1])
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
    @Min(0)
    diem_chuan!: number;

    /**
     * Average Conduct for grade 10: 1=GOOD (Tốt), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa đạt)
     */
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hk10!: number;

    /**
     * Average Conduct for grade 11: 1=GOOD (Tốt), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa đạt)
     */
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hk11!: number;

    /**
     * Average Conduct for grade 12: 1=GOOD (Tốt), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa đạt)
     */
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hk12!: number;

    /**
     * Academic performance grade 10: 1=GOOD (Giỏi), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa Đạt)
     */
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hl10!: number;

    /**
     * Academic performance grade 11: 1=GOOD (Giỏi), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa Đạt)
     */
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hl11!: number;

    /**
     * Academic performance grade 12: 1=GOOD (Giỏi), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa Đạt)
     */
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hl12!: number;

    /**
     * Expected tuition fee for the program (VND per year)
     * @example 10000000 (10 million VND)
     */
    @IsNumber()
    @Min(0)
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
