import { Expose, Transform, Type } from "class-transformer";
import {
    IsArray,
    IsEnum,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from "class-validator";

import { HsgSubject } from "@/dto/prediction/hsg-subject.enum.js";
import { MajorGroupCodes } from "@/type/enum/major.js";

/**
 * Batch request for L1 predictions - contains multiple User Inputs L1 for initial prioritization.
 */
export class L1BatchRequest {
    @Expose()
    @IsArray()
    @IsNotEmpty()
    @Type(() => UserInputL1)
    @ValidateNested({ each: true })
    items!: UserInputL1[];
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
    @Expose()
    @IsIn([0, 1])
    @IsInt()
    @Transform(({ value }) => {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
            const parsed = parseInt(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    })
    ahld!: number;

    /**
     * University type: 1 for public (Công lập), 0 for private (Tư thục)
     */
    @Expose()
    @IsIn([0, 1])
    @IsInt()
    cong_lap!: number;

    /**
     * Ethnic minority (Dân tộc thiểu số)
     * 1: Yes, 0: No
     */
    @Expose()
    @IsIn([0, 1])
    @IsInt()
    @Transform(({ value }) => {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
            const parsed = parseInt(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    })
    dan_toc_thieu_so!: number;

    /**
     * From one of the 50 poor districts (50 huyện nghèo/TNB)
     * 1: Yes, 0: No
     */
    @Expose()
    @IsIn([0, 1])
    @IsInt()
    @Transform(({ value }) => {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
            const parsed = parseInt(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    })
    haimuoi_huyen_ngheo_tnb!: number;

    /**
     * Expected tuition fee for the program (VND per year)
     * @example 10000000 (10 million VND)
     */
    @Expose()
    @IsInt()
    @Min(0)
    hoc_phi!: number;

    /**
     * National Excellent Student Award - First Prize Subject
     * @example "Toán"
     */
    @Expose()
    @IsEnum(HsgSubject)
    @IsOptional()
    @IsString()
    hsg_1?: HsgSubject | number;

    /**
     * National Excellent Student Award - Second Prize Subject
     * @example "Lý"
     */
    @Expose()
    @IsEnum(HsgSubject)
    @IsOptional()
    @IsString()
    hsg_2?: HsgSubject | number;

    /**
     * National Excellent Student Award - Third Prize Subject
     * @example "Tin"
     */
    @Expose()
    @IsEnum(HsgSubject)
    @IsOptional()
    @IsString()
    hsg_3?: HsgSubject | number;

    /**
     * Major group code
     * @example 714, 732
     */
    @Expose()
    @IsIn(MajorGroupCodes)
    @IsInt()
    nhom_nganh!: number;

    /**
     * Province/City name
     * @example "TP. Hồ Chí Minh", "Hà Nội"
     */
    @Expose()
    @IsString()
    tinh_tp!: string;
}
