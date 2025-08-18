import { Expose } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, Max, Min } from "class-validator";

import { Conduct } from "@/type/enum/conduct.js";

export class ConductResponse {
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
    @IsEnum(Conduct)
    @IsNotEmpty()
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
    @IsInt()
    @Max(12)
    @Min(1)
    grade!: number;
}
