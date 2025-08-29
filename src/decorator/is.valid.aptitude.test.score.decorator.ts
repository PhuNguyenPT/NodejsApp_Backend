import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

import { AptitudeTestRequest } from "../dto/student/aptitude.test.request.js"; // Adjust path as needed
import { validateExamTypeScore } from "../type/enum/exam.js"; // Adjust path as needed

/**
 * Custom validator constraint for AptitudeTestRequest score.
 * It uses the shared `validateExamTypeScore` logic to ensure the score
 * is valid for the specified exam type and falls within its expected range.
 */
@ValidatorConstraint({ async: false, name: "isValidAptitudeTestScore" })
export class IsValidExamScoreConstraint
    implements ValidatorConstraintInterface
{
    /**
     * Provides the default error message when validation fails.
     * It extracts the specific error message from `validateExamTypeScore`.
     * @param args - Validation arguments.
     * @returns The error message string.
     */
    defaultMessage(args: ValidationArguments): string {
        const aptitudeTestRequest = args.object as AptitudeTestRequest;
        const examType = aptitudeTestRequest.examType;
        const score = aptitudeTestRequest.score;

        // examType is guaranteed to be present by @IsNotEmpty on AptitudeTestRequest.examType
        const errors = validateExamTypeScore(examType, score.toString());

        // Return the specific error message, or a generic one if not found
        return (
            errors.level ??
            `The provided score for ${examType.value} is invalid.`
        );
    }

    /**
     * Validates if the provided score is valid for the associated examType.
     * @param score - The score value being validated (can be number or string for A-Level).
     * @param args - Validation arguments, including the object being validated (AptitudeTestRequest).
     * @returns True if the score is valid, false otherwise.
     */
    validate(score: number, args: ValidationArguments): boolean {
        const aptitudeTestRequest = args.object as AptitudeTestRequest;
        const examType = aptitudeTestRequest.examType;

        // `examType` and `score` are guaranteed to be present due to `@IsNotEmpty`
        // decorators on the `AptitudeTestRequest` properties.

        // Use the shared validation logic to get detailed errors
        const errors = validateExamTypeScore(examType, score.toString());

        // The score is valid if `validateExamTypeScore` returns an empty errors object
        // or specifically if the 'level' error is undefined.
        return Object.keys(errors).length === 0 || errors.level === undefined;
    }
}
