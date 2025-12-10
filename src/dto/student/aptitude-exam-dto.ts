import { Expose, Type } from "class-transformer";
import {
    IsNotEmpty,
    Validate,
    ValidateIf,
    ValidateNested,
} from "class-validator";

import { VnuhcmComponentDTO } from "@/dto/student/vnuhcm-component.dto.js";
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
     * Numeric score for the aptitude test
     * @example 700
     */
    @Expose()
    @IsNotEmpty({ message: "Aptitude test score is required" })
    @Validate(IsValidAptitudeExamScoreConstraint)
    score!: number;
    @Expose({ name: "vnuhcmScoreComponents" }) // Use 'name' to match the Entity's relation
    @Type(() => VnuhcmComponentDTO)
    @ValidateIf((o: AptitudeExamDTO) => o.examType === ExamType.VNUHCM)
    @ValidateNested()
    vnuhcmComponents?: VnuhcmComponentDTO;
}
