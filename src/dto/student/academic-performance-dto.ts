import { Expose } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, Max, Min } from "class-validator";

import { AcademicPerformance } from "@/type/enum/academic-performance.js";

/**
 * Data Transfer Object for student academic performance assessment.
 * Contains academic performance rating and corresponding grade level information.
 * Used to track student academic performance across different academic years.
 *
 * @class AcademicPerformanceDTO
 * @example
 * {
 *   "academicPerformance": "Giỏi",
 *   "grade": 10
 * }
 * @example
 * {
 *   "academicPerformance": "Khá",
 *   "grade": 11
 * }
 * @example
 * {
 *   "academicPerformance": "Xuát sắc",
 *   "grade": 12
 * }
 */
export class AcademicPerformanceDTO {
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
    @IsNotEmpty({ message: "Academic performance is required" })
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
    @IsInt({ message: "Grade must be an integer" })
    @IsNotEmpty({ message: "Grade is required" })
    @Max(12, { message: "Grade cannot exceed 12" })
    @Min(1, { message: "Grade must be at least 1" })
    grade!: number;
}
