// src/dto/student/vnuhcm-component.dto.ts
import { Expose } from "class-transformer";
import { IsInt, IsNotEmpty, Max, Min } from "class-validator";

/**
 * DTO for VNUHCM component scores (Language, Math, Science/Logic)
 */
export class VnuhcmComponentDTO {
    /**
     * Language score component
     * @range [0, 400]
     */
    @Expose()
    @IsInt({ message: "Language score must be an integer" })
    @IsNotEmpty({ message: "Language score is required" })
    @Max(400, { message: "Language score must not exceed 400" })
    @Min(0, { message: "Language score must be at least 0" })
    languageScore!: number;

    /**
     * Math score component
     * @range [0, 300]
     */
    @Expose()
    @IsInt({ message: "Math score must be an integer" })
    @IsNotEmpty({ message: "Math score is required" })
    @Max(300, { message: "Math score must not exceed 300" })
    @Min(0, { message: "Math score must be at least 0" })
    mathScore!: number;

    /**
     * Science & Logic score component
     * @range [0, 500]
     */
    @Expose()
    @IsInt({ message: "Science & Logic score must be an integer" })
    @IsNotEmpty({ message: "Science & Logic score is required" })
    @Max(500, { message: "Science & Logic score must not exceed 500" })
    @Min(0, { message: "Science & Logic score must be at least 0" })
    scienceLogic!: number;
}
