import { Expose, Type } from "class-transformer";
import {
    IsEnum,
    IsNotEmpty,
    Validate,
    ValidateIf,
    ValidateNested,
} from "class-validator";

import { VnuhcmComponentDTO } from "@/dto/student/vnuhcm-component.dto.js";
import { DGNLType } from "@/type/enum/exam-type.enum.js";
import { IsValidAptitudeExamScoreConstraint } from "@/validator/is-valid-aptitude-exam-score.validator.js";
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
    @IsEnum(DGNLType)
    @IsNotEmpty({ message: "Exam type is required" })
    @ValidateVnuhcmComponents()
    examType!: DGNLType;

    /**
     * Numeric score for the aptitude test
     * @example 700
     */
    @Expose()
    @IsNotEmpty({ message: "Aptitude test score is required" })
    @Validate(IsValidAptitudeExamScoreConstraint)
    score!: number;
    @Expose({ name: "vnuhcmScoreComponents" }) // Use 'name' to match the Entity's relation
    @Type(() => VnuhcmComponentDTO)
    @ValidateIf((o: AptitudeExamDTO) => o.examType === DGNLType.VNUHCM)
    @ValidateNested()
    vnuhcmComponents?: VnuhcmComponentDTO;
}
