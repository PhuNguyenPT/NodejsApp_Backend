import { ValidationException } from "../exception/validation.exception.js";

// Single unified enum for all exam types
export enum ExamType {
    A_Level = "Alevel",
    ACT = "ACT",
    Duolingo_English_Test = "DoulingoEnglishTest",
    HSA = "HSA",
    IB = "IB",
    IELTS = "IELTS",
    JLPT = "JLPT",
    OSSD = "OSSD",
    PTE_Academic = "PTEAcademic",
    SAT = "SAT",
    TOEFL_CBT = "TOEFL CBT",
    TOEFL_iBT = "TOEFL iBT",
    TOEFL_Paper = "TOEFL Paper",
    TOEIC = "TOEIC",
    TSA = "TSA",
    VNUHCM = "VNUHCM",
}

// Helper constants for categorization
export const CCNNTypes = [
    ExamType.IELTS,
    ExamType.JLPT,
    ExamType.TOEFL_CBT,
    ExamType.TOEFL_iBT,
    ExamType.TOEFL_Paper,
    ExamType.TOEIC,
] as const;

export const CCQTTypes = [
    ExamType.A_Level,
    ExamType.ACT,
    ExamType.Duolingo_English_Test,
    ExamType.IB,
    ExamType.OSSD,
    ExamType.PTE_Academic,
    ExamType.SAT,
] as const;

export const DGNLTypes = [ExamType.HSA, ExamType.TSA, ExamType.VNUHCM] as const;

export type CCNNType = (typeof CCNNTypes)[number];
export type CCQTType = (typeof CCQTTypes)[number];
export type DGNLType = (typeof DGNLTypes)[number];

export interface Exam {
    examType: ExamType;
    level: string;
}

export function getExamCategory(
    examType: ExamType,
): "CCNN" | "CCQT" | "ĐGNL" | null {
    if (isCCNNType(examType)) return "CCNN";
    if (isCCQTType(examType)) return "CCQT";
    if (isDGNLType(examType)) return "ĐGNL";
    return null;
}

/**
 * Handles the validation of a single exam score/level and throws ValidationException if errors exist.
 */
export function handleExamValidation(
    examType: ExamType,
    level: string,
    prefix?: string,
): void {
    const validationResults: Record<string, string | undefined> =
        validateExamTypeScore(examType, level);

    const stringValidationErrors: Record<string, string> = {};
    for (const key in validationResults) {
        if (validationResults[key]) {
            const prefixedKey = prefix ? `${prefix}.${key}` : key;
            stringValidationErrors[prefixedKey] = validationResults[key];
        }
    }

    if (Object.keys(stringValidationErrors).length > 0) {
        throw new ValidationException(stringValidationErrors);
    }
}

// Type guards for categorization
export function isCCNNType(examType: ExamType): boolean {
    return (CCNNTypes as readonly ExamType[]).includes(examType);
}

export function isCCQTType(examType: ExamType): boolean {
    return (CCQTTypes as readonly ExamType[]).includes(examType);
}

export function isDGNLType(examType: ExamType): boolean {
    return (DGNLTypes as readonly ExamType[]).includes(examType);
}

/**
 * Validates an exam's score/level based on its type and provides specific error messages.
 */
export function validateExamTypeScore(
    examType: ExamType,
    level: string,
): Record<string, string | undefined> {
    const errors: Record<string, string | undefined> = {};

    const setErrorMessage = (message: string) => {
        errors.level = message;
    };

    // Handle A-Level separately as its level is a string grade, not a number
    if (examType === ExamType.A_Level) {
        const validGrades = ["A", "A*", "B", "C", "D", "E", "F", "N", "O", "U"];
        if (!validGrades.includes(level.toUpperCase())) {
            setErrorMessage(`Level must be one of: ${validGrades.join(", ")}.`);
        }
        return errors;
    }

    if (examType === ExamType.JLPT) {
        const validJLPTGrades = ["N1", "N2", "N3"];
        if (!validJLPTGrades.includes(level.toUpperCase())) {
            setErrorMessage(
                `Level must be one of: ${validJLPTGrades.join(", ")}`,
            );
        }
        return errors;
    }

    // For all other exams, the level must be a valid number
    const parsedLevel = parseFloat(level);
    if (isNaN(parsedLevel)) {
        setErrorMessage("Level must be a valid number.");
        return errors;
    }

    switch (examType) {
        case ExamType.ACT:
            if (parsedLevel < 1 || parsedLevel > 36)
                setErrorMessage("Score must be between 1 and 36.");
            break;
        case ExamType.Duolingo_English_Test:
            if (parsedLevel < 10 || parsedLevel > 160)
                setErrorMessage("Score must be between 10 and 160.");
            break;
        case ExamType.HSA:
            if (parsedLevel < 0 || parsedLevel > 150)
                setErrorMessage("Score must be between 0 and 150.");
            break;
        case ExamType.IB:
            if (parsedLevel < 0 || parsedLevel > 45)
                setErrorMessage("Score must be between 0 and 45.");
            break;
        case ExamType.IELTS:
            if (parsedLevel < 1 || parsedLevel > 9)
                setErrorMessage("Score must be between 1 and 9.");
            break;
        case ExamType.OSSD:
            if (parsedLevel < 0 || parsedLevel > 100)
                setErrorMessage("Score must be between 0 and 100.");
            break;
        case ExamType.PTE_Academic:
            if (parsedLevel < 10 || parsedLevel > 90)
                setErrorMessage("Score must be between 10 and 90.");
            break;
        case ExamType.SAT:
            if (parsedLevel < 400 || parsedLevel > 1600)
                setErrorMessage("Score must be between 400 and 1600.");
            break;
        case ExamType.TOEFL_CBT:
            if (parsedLevel < 33 || parsedLevel > 300)
                setErrorMessage("Score must be between 33 and 300.");
            break;
        case ExamType.TOEFL_iBT:
            if (parsedLevel < 0 || parsedLevel > 120)
                setErrorMessage("Score must be between 0 and 120.");
            break;
        case ExamType.TOEFL_Paper:
            if (parsedLevel < 310 || parsedLevel > 677)
                setErrorMessage("Score must be between 310 and 677.");
            break;

        case ExamType.TOEIC:
            if (parsedLevel < 60 || parsedLevel > 990)
                setErrorMessage("Score must be between 60 and 990.");
            break;
        case ExamType.TSA:
            if (parsedLevel < 0 || parsedLevel > 100)
                setErrorMessage("Score must be between 0 and 100.");
            break;
        case ExamType.VNUHCM:
            if (parsedLevel < 0 || parsedLevel > 1200)
                setErrorMessage("Score must be between 0 and 1200.");
            break;

        default:
            setErrorMessage("Invalid exam type.");
            break;
    }

    return errors;
}
