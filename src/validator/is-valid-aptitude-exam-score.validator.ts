import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

import { AptitudeExamRequest } from "@/dto/student/aptitude-exam-request.js";
import { validateExamTypeScore } from "@/type/enum/exam.js";

/**
 * Custom validator constraint for Aptitude Test scores.
 * Uses the shared `validateExamTypeScore` logic to ensure the score
 * is valid for the specified exam type and falls within its expected range.
 */
@ValidatorConstraint({ async: false, name: "isValidAptitudeTestScore" })
export class IsValidAptitudeExamScoreConstraint
    implements ValidatorConstraintInterface
{
    /**
     * Provides the default error message when validation fails.
     * It extracts the specific error message from `validateExamTypeScore`.
     * @param args - Validation arguments.
     * @returns The error message string.
     */
    defaultMessage(args: ValidationArguments): string {
        const aptitudeExam = args.object as AptitudeExamRequest;
        const examType = aptitudeExam.examType;
        const score = String(aptitudeExam.score);

        const errors = validateExamTypeScore(examType, score);

        return errors.level ?? `The provided score for ${examType} is invalid.`;
    }

    /**
     * Validates if the provided score is valid for the associated examType.
     * @param score - The score value being validated (can be number or string for A-Level).
     * @param args - Validation arguments, including the object being validated (AptitudeExamRequest).
     * @returns True if the score is valid, false otherwise.
     */
    validate(score: number, args: ValidationArguments): boolean {
        const aptitudeExam = args.object as AptitudeExamRequest;
        const examType = aptitudeExam.examType;

        const errors = validateExamTypeScore(examType, String(score));

        return Object.keys(errors).length === 0 || errors.level === undefined;
    }
}
