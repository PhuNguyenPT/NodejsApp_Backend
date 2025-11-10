import { Expose, Type } from "class-transformer";
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

/**
 * Batch request for L2 predictions - contains multiple User Inputs L2 for initial prioritization.
 */
export class L2BatchRequest {
    @IsArray()
    @IsNotEmpty()
    @Type(() => UserInputL2)
    @ValidateNested({ each: true })
    items!: UserInputL2[];
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
    @Expose()
    @IsIn([0, 1])
    @IsInt()
    cong_lap!: number;

    /**
     * English certificate score/level (optional)
     * @example "B2", "6.5", "750"
     */
    @Expose()
    @IsOptional()
    @IsString()
    diem_ccta?: string;

    /**
     * Actual test score or benchmark score achieved by the student
     */
    @Expose()
    @IsNumber()
    @Min(0)
    diem_chuan!: number;

    /**
     * Average Conduct for grade 10: 1=GOOD (Tốt), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa đạt)
     */
    @Expose()
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hk10!: number;

    /**
     * Average Conduct for grade 11: 1=GOOD (Tốt), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa đạt)
     */
    @Expose()
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hk11!: number;

    /**
     * Average Conduct for grade 12: 1=GOOD (Tốt), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa đạt)
     */
    @Expose()
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hk12!: number;

    /**
     * Academic performance grade 10: 1=GOOD (Giỏi), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa Đạt)
     */
    @Expose()
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hl10!: number;

    /**
     * Academic performance grade 11: 1=GOOD (Giỏi), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa Đạt)
     */
    @Expose()
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hl11!: number;

    /**
     * Academic performance grade 12: 1=GOOD (Giỏi), 2=SATISFACTORY (Khá), 3=PASSED (Đạt), 4=NOT_PASSED (Chưa Đạt)
     */
    @Expose()
    @IsIn([1, 2, 3, 4])
    @IsInt()
    hl12!: number;

    /**
     * Expected tuition fee for the program (VND per year)
     * @example 10000000 (10 million VND)
     */
    @Expose()
    @IsInt()
    @Min(0)
    hoc_phi!: number;

    /**
     * Major group code
     * @example 714, 732
     */
    @Expose()
    @IsIn(MajorGroupCodes)
    @IsInt()
    nhom_nganh!: number;

    /**
     * Name of English certificate (optional)
     * @example "IELTS", "TOEFL", "TOEIC"
     */
    @Expose()
    @IsOptional()
    @IsString()
    ten_ccta?: string;

    /**
     * Province/City name
     * @example "TP. Hồ Chí Minh", "Hà Nội"
     */
    @Expose()
    @IsNotEmpty()
    @IsString()
    tinh_tp!: string;

    /**
     * Subject combination code
     * @example "D01", "A00", "VNUHCM"
     */
    @Expose()
    @IsNotEmpty()
    @IsString()
    to_hop_mon!: string;
}
