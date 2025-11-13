// vnuhcm-components-not-allowed.validator.ts
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

import { AptitudeExamRequest } from "@/dto/student/aptitude-exam-request.js";
import { ExamType } from "@/type/enum/exam-type.js";

/**
 * Custom validator to ensure VNUHCM component scores are only provided for VNUHCM exams
 * and are rejected for other exam types.
 */
@ValidatorConstraint({ async: false, name: "vnuhcmComponentsNotAllowed" })
export class VnuhcmComponentsNotAllowedConstraint
    implements ValidatorConstraintInterface
{
    defaultMessage(args: ValidationArguments): string {
        const aptitudeExam = args.object as AptitudeExamRequest;
        const { examType, languageScore, mathScore, scienceLogic } =
            aptitudeExam;

        const providedComponents: string[] = [];
        if (languageScore !== undefined)
            providedComponents.push("languageScore");
        if (mathScore !== undefined) providedComponents.push("mathScore");
        if (scienceLogic !== undefined) providedComponents.push("scienceLogic");

        if (providedComponents.length > 0) {
            return `${providedComponents.join(", ")} can only be provided for VNUHCM exam type, but received ${examType}`;
        }

        return "Invalid component scores for exam type";
    }

    validate(_value: unknown, args: ValidationArguments): boolean {
        const aptitudeExam = args.object as AptitudeExamRequest;
        const { examType, languageScore, mathScore, scienceLogic } =
            aptitudeExam;

        // If examType is VNUHCM, component scores are allowed (handled by other validators)
        if (examType === ExamType.VNUHCM) {
            return true;
        }

        // For non-VNUHCM exams, component scores should not be provided
        const hasComponentScores =
            languageScore !== undefined ||
            mathScore !== undefined ||
            scienceLogic !== undefined;

        // Validation passes if no component scores are provided
        return !hasComponentScores;
    }
}

/**
 * Decorator function to validate VNUHCM components are not allowed for non-VNUHCM exams
 */
export function ValidateVnuhcmComponents(
    validationOptions?: ValidationOptions,
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            constraints: [],
            options: validationOptions,
            propertyName: propertyName,
            target: object.constructor,
            validator: VnuhcmComponentsNotAllowedConstraint,
        });
    };
}
