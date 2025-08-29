import { Expose } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, Max, Min } from "class-validator";

import { Conduct } from "@/type/enum/conduct.js";

/**
 * Data Transfer Object for student conduct/behavior assessment.
 * Contains conduct rating and corresponding grade level information.
 * Used to track student behavior across different academic years.
 *
 * @class ConductRequest
 * @example
 * {
 *   "conduct": "Tốt",
 *   "grade": 10
 * }
 * @example
 * {
 *   "conduct": "Khá",
 *   "grade": 11
 * }
 * @example
 * {
 *   "conduct": "Đạt",
 *   "grade": 12
 * }
 */
export class ConductRequest {
    /**
     * Student conduct/behavior assessment
     * Single conduct rating for a specific grade/year
     * Valid values are defined in the Conduct enum.
     * @type {Conduct}
     * @required
     * @see Conduct for valid enum values
     * @example "Tốt"
     * @example "Trung bình"
     */
    @Expose()
    @IsEnum(Conduct, {
        message: "Conduct must be a valid enum value",
    })
    @IsNotEmpty({ message: "Conduct is required" })
    conduct!: Conduct;

    /**
     * Grade/year level for this conduct assessment
     * Represents the academic year when this conduct was assessed
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
