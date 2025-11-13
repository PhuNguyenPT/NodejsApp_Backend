import { Expose } from "class-transformer";
import {
    IsInt,
    IsNotEmpty,
    Max,
    Min,
    Validate,
    ValidateIf,
} from "class-validator";

import { ExamType } from "@/type/enum/exam-type.js";
import { IsValidAptitudeExamScoreConstraint } from "@/validator/is-valid-aptitude-exam-score.validator.js";
import { IsValidDGNLExamTypeConstraint } from "@/validator/is-valid-exam-type.validator.js";
import { ValidateVnuhcmComponents } from "@/validator/vnuhcm-components-not-allowed.validator.js";

/**
 * DTO for aptitude test information containing both type and score
 * @example
 * {
 *   "examType": "VNUHCM",
 *   "score": 700
 * }
 */
export class AptitudeExamDTO {
    /**
     * Type of exam/aptitude test
     * @example "VNUHCM"
     */
    @Expose()
    @IsNotEmpty({ message: "Exam type is required" })
    @Validate(IsValidDGNLExamTypeConstraint)
    @ValidateVnuhcmComponents()
    examType!: ExamType;

    /**
     * Language score component for VNUHCM exam
     * Required when examType is VNUHCM
     * @example 350
     * @range [0, 400]
     */
    @Expose()
    @IsInt({ message: "Language score must be an integer" })
    @IsNotEmpty({ message: "Language score is required for VNUHCM" })
    @Max(400, { message: "Language score must not exceed 400" })
    @Min(0, { message: "Language score must be at least 0" })
    @ValidateIf((o: AptitudeExamDTO) => o.examType === ExamType.VNUHCM)
    languageScore?: number;

    /**
     * Math score component for VNUHCM exam
     * Required when examType is VNUHCM
     * @example 200
     * @range [0, 300]
     */
    @Expose()
    @IsInt({ message: "Math score must be an integer" })
    @IsNotEmpty({ message: "Math score is required for VNUHCM" })
    @Max(300, { message: "Math score must not exceed 300" })
    @Min(0, { message: "Math score must be at least 0" })
    @ValidateIf((o: AptitudeExamDTO) => o.examType === ExamType.VNUHCM)
    mathScore?: number;

    /**
     * Science & Logic score component for VNUHCM exam
     * Required when examType is VNUHCM
     * @example 150
     * @range [0, 500]
     */
    @Expose()
    @IsInt({ message: "Science & Logic score must be an integer" })
    @IsNotEmpty({ message: "Science & Logic score is required for VNUHCM" })
    @Max(500, { message: "Science & Logic score must not exceed 500" })
    @Min(0, { message: "Science & Logic score must be at least 0" })
    @ValidateIf((o: AptitudeExamDTO) => o.examType === ExamType.VNUHCM)
    scienceLogic?: number;
    /**
     * Numeric score for the aptitude test
     * @example 700
     */
    @Expose()
    @IsNotEmpty({ message: "Aptitude test score is required" })
    @Validate(IsValidAptitudeExamScoreConstraint)
    score!: number;
}
