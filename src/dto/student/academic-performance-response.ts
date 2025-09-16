import { Expose } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, Max, Min } from "class-validator";

import { AcademicPerformance } from "@/type/enum/academic-performance.js";

export class AcademicPerformanceResponse {
    /**
     * Academic performance assessment
     * Single performance rating for a specific grade/year
     * Valid values are defined in the AcademicPerformance enum.
     * @type {AcademicPerformance}
     * @required
     * @see AcademicPerformance for valid enum values
     * @example "Giỏi"
     * @example "Khá"
     * @example "Trung bình"
     */
    @Expose()
    @IsEnum(AcademicPerformance)
    @IsNotEmpty()
    academicPerformance!: AcademicPerformance;

    /**
     * Grade/year level for this academic performance assessment
     * Represents the academic year when this performance was assessed
     * @type {number}
     * @required
     * @minimum 1
     * @maximum 12
     * @example 10
     * @example 11
     * @example 12
     */
    @Expose()
    @IsInt()
    @Max(12)
    @Min(1)
    grade!: number;
}
