import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

import { Exam, validateExamTypeScore } from "@/type/enum/exam.js";

/**
 * Custom validator constraint for Exam level.
 * It uses the shared `validateExamTypeScore` logic to ensure the level
 * is valid for the specified exam type and falls within its expected range.
 */
@ValidatorConstraint({ async: false, name: "isValidExamLevel" })
export class IsValidExamLevelConstraint
    implements ValidatorConstraintInterface
{
    /**
     * Provides the default error message when validation fails.
     * It extracts the specific error message from `validateExamTypeScore`.
     * @param args - Validation arguments.
     * @returns The error message string.
     */
    defaultMessage(args: ValidationArguments): string {
        const aptitudeTestRequest = args.object as Exam;
        const examType = aptitudeTestRequest.examType;
        const level = aptitudeTestRequest.level;

        const errors = validateExamTypeScore(examType, level);

        return errors.level ?? `The provided score for ${examType} is invalid.`;
    }

    /**
     * Validates if the provided score is valid for the associated examType.
     * @param level - The level value being validated.
     * @param args - Validation arguments, including the object being validated
     * @returns True if the level is valid, false otherwise.
     */
    validate(level: string, args: ValidationArguments): boolean {
        const aptitudeTestRequest = args.object as Exam;
        const examType = aptitudeTestRequest.examType;

        const errors = validateExamTypeScore(examType, level);

        return Object.keys(errors).length === 0 || errors.level === undefined;
    }
}
