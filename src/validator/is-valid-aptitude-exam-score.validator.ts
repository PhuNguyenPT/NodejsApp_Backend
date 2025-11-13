// src/validator/is-valid-aptitude-exam-score.validator.ts
import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

import { AptitudeExamRequest } from "@/dto/student/aptitude-exam-request.js";
import { ExamType, validateExamTypeScore } from "@/type/enum/exam-type.js";

/**
 * Custom validator constraint for Aptitude Test scores.
 * Uses the shared `validateExamTypeScore` logic to ensure the score
 * is valid for the specified exam type and falls within its expected range.
 * For VNUHCM, also validates that the sum of component scores equals the total score.
 */
@ValidatorConstraint({ async: false, name: "isValidAptitudeExamScore" })
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

        if (examType === ExamType.VNUHCM) {
            const { languageScore, mathScore, scienceLogic } = aptitudeExam;

            if (
                languageScore !== undefined &&
                mathScore !== undefined &&
                scienceLogic !== undefined
            ) {
                const sum = languageScore + mathScore + scienceLogic;
                const totalScore =
                    typeof aptitudeExam.score === "string"
                        ? Number(aptitudeExam.score)
                        : aptitudeExam.score;

                if (sum !== totalScore) {
                    return `Total score (${String(totalScore)}) must equal the sum of language (${String(languageScore)}), math (${String(mathScore)}), and science & logic (${String(scienceLogic)}) scores. Current sum: ${String(sum)}`;
                }
            }
        }

        const errors = validateExamTypeScore(examType, score);
        return errors.level ?? `The provided score for ${examType} is invalid.`;
    }

    /**
     * Validates if the provided score is valid for the associated examType.
     * For VNUHCM, also validates that component scores sum to the total.
     * @param score - The score value being validated (can be number or string for A-Level).
     * @param args - Validation arguments, including the object being validated (AptitudeExamRequest).
     * @returns True if the score is valid, false otherwise.
     */
    validate(score: number | string, args: ValidationArguments): boolean {
        const aptitudeExam = args.object as AptitudeExamRequest;
        const examType = aptitudeExam.examType;

        const errors = validateExamTypeScore(examType, String(score));
        if (errors.level !== undefined) {
            return false;
        }

        if (examType === ExamType.VNUHCM) {
            const { languageScore, mathScore, scienceLogic } = aptitudeExam;

            if (
                languageScore !== undefined &&
                mathScore !== undefined &&
                scienceLogic !== undefined
            ) {
                const sum = languageScore + mathScore + scienceLogic;
                const totalScore =
                    typeof score === "string" ? Number(score) : score;

                return sum === totalScore;
            }
        }

        return true;
    }
}
