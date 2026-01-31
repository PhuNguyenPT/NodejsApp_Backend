import { ValidationException } from "../exception/validation.exception.js";

// Separate enums for each category
export enum CCNNType {
    IELTS = "IELTS",
    JLPT = "JLPT",
    TOEFL_CBT = "TOEFL CBT",
    TOEFL_iBT = "TOEFL iBT",
    TOEFL_Paper = "TOEFL Paper",
    TOEIC = "TOEIC",
}

export enum CCQTType {
    A_Level = "Alevel",
    ACT = "ACT",
    Duolingo_English_Test = "DoulingoEnglishTest",
    IB = "IB",
    OSSD = "OSSD",
    PTE_Academic = "PTEAcademic",
    SAT = "SAT",
}

export enum DGNLType {
    HSA = "HSA",
    TSA = "TSA",
    VNUHCM = "VNUHCM",
}

// Combined type for all exam types
export type ExamType = CCNNType | CCQTType | DGNLType;

// For @IsEnum decorator - only CCNN and CCQT types for certifications
export const CertificationExamTypeEnum = {
    ...CCNNType,
    ...CCQTType,
} as const;

export type CertificationType = CCNNType | CCQTType;

export interface Exam {
    examType: ExamType;
    level: string;
}

export function getExamCategory(
    examType: unknown,
): "CCNN" | "CCQT" | "ĐGNL" | undefined {
    if (isCCNNType(examType)) return "CCNN";
    if (isCCQTType(examType)) return "CCQT";
    if (isDGNLType(examType)) return "ĐGNL";
    return undefined;
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
export function isCCNNType(examType: unknown): examType is CCNNType {
    return Object.values(CCNNType).includes(examType as CCNNType);
}

export function isCCQTType(examType: unknown): examType is CCQTType {
    return Object.values(CCQTType).includes(examType as CCQTType);
}

export function isDGNLType(examType: unknown): examType is DGNLType {
    return Object.values(DGNLType).includes(examType as DGNLType);
}

export function isExam(obj: unknown): obj is Exam {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "examType" in obj &&
        "level" in obj
    );
}

/**
 * Validates an exam's score/level based on its type and provides specific error messages.
 */
export function validateExamTypeScore(
    examType: CCNNType | CCQTType | DGNLType,
    level: null | string | undefined,
): Record<string, string | undefined> {
    const errors: Record<string, string | undefined> = {};

    if (!level) {
        errors.level = "Level is required.";
        return errors;
    }
    const trimmedLevel = level.trim();

    const setErrorMessage = (message: string) => {
        errors.level = message;
    };

    if (examType === CCQTType.A_Level) {
        const validGrades = ["A", "A*", "B", "C", "D", "E", "F", "N", "O", "U"];
        if (!validGrades.includes(trimmedLevel)) {
            setErrorMessage(`Level must be one of: ${validGrades.join(", ")}.`);
        }
        return errors;
    }

    // Handle JLPT separately
    if (examType === CCNNType.JLPT) {
        const validJLPTGrades = ["N1", "N2", "N3", "N4", "N5"];
        if (!validJLPTGrades.includes(trimmedLevel)) {
            setErrorMessage(
                `Level must be one of: ${validJLPTGrades.join(", ")}`,
            );
        }
        return errors;
    }

    const parsedLevel = parseFloat(trimmedLevel);

    if (isNaN(parsedLevel)) {
        setErrorMessage("Level must be a valid number.");
        return errors;
    }

    if (isCCNNType(examType)) {
        validateCCNNNumericScore(examType, parsedLevel, setErrorMessage);
    } else if (isCCQTType(examType)) {
        validateCCQTNumericScore(examType, parsedLevel, setErrorMessage);
    } else if (isDGNLType(examType)) {
        validateDGNLNumericScore(examType, parsedLevel, setErrorMessage);
    }

    return errors;
}

/**
 * Validates numeric scores for CCNN exam types (excluding JLPT).
 */
function validateCCNNNumericScore(
    examType: CCNNType,
    parsedLevel: number,
    setErrorMessage: (message: string) => void,
): void {
    switch (examType) {
        case CCNNType.IELTS:
            if (parsedLevel < 1 || parsedLevel > 9)
                setErrorMessage("Score must be between 1 and 9.");
            else if ((parsedLevel * 2) % 1 !== 0)
                setErrorMessage(
                    "Score must be in 0.5 increments (e.g., 6.5, 7.0, 7.5).",
                );
            break;
        case CCNNType.TOEFL_CBT:
            if (parsedLevel < 33 || parsedLevel > 300)
                setErrorMessage("Score must be between 33 and 300.");
            else if (parsedLevel % 1 !== 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case CCNNType.TOEFL_iBT:
            if (parsedLevel < 0 || parsedLevel > 120)
                setErrorMessage("Score must be between 0 and 120.");
            else if (parsedLevel % 1 !== 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case CCNNType.TOEFL_Paper:
            if (parsedLevel < 310 || parsedLevel > 677)
                setErrorMessage("Score must be between 310 and 677.");
            else if (parsedLevel % 1 !== 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case CCNNType.TOEIC:
            if (parsedLevel < 60 || parsedLevel > 990)
                setErrorMessage("Score must be between 60 and 990.");
            else if (parsedLevel % 5 !== 0)
                setErrorMessage("Score must be a multiple of 5.");
            break;
    }
}

/**
 * Validates numeric scores for CCQT exam types (excluding A_Level).
 */
function validateCCQTNumericScore(
    examType: CCQTType,
    parsedLevel: number,
    setErrorMessage: (message: string) => void,
): void {
    switch (examType) {
        case CCQTType.ACT:
            if (parsedLevel < 1 || parsedLevel > 36)
                setErrorMessage("Score must be between 1 and 36.");
            else if (parsedLevel % 1 !== 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case CCQTType.Duolingo_English_Test:
            if (parsedLevel < 10 || parsedLevel > 160)
                setErrorMessage("Score must be between 10 and 160.");
            else if (parsedLevel % 5 !== 0)
                setErrorMessage("Score must be a multiple of 5.");
            break;
        case CCQTType.IB:
            if (parsedLevel < 0 || parsedLevel > 45)
                setErrorMessage("Score must be between 0 and 45.");
            else if (parsedLevel % 1 !== 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case CCQTType.OSSD:
            if (parsedLevel < 0 || parsedLevel > 100)
                setErrorMessage("Score must be between 0 and 100.");
            else if (parsedLevel % 1 !== 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case CCQTType.PTE_Academic:
            if (parsedLevel < 10 || parsedLevel > 90)
                setErrorMessage("Score must be between 10 and 90.");
            else if (parsedLevel % 1 !== 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case CCQTType.SAT:
            if (parsedLevel < 400 || parsedLevel > 1600)
                setErrorMessage("Score must be between 400 and 1600.");
            else if (parsedLevel % 10 !== 0)
                setErrorMessage("Score must be a multiple of 10.");
            break;
    }
}

/**
 * Validates numeric scores for DGNL exam types.
 */
function validateDGNLNumericScore(
    examType: DGNLType,
    parsedLevel: number,
    setErrorMessage: (message: string) => void,
): void {
    switch (examType) {
        case DGNLType.HSA:
            if (parsedLevel < 0 || parsedLevel > 150)
                setErrorMessage("Score must be between 0 and 150.");
            else if (parsedLevel % 1 !== 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case DGNLType.TSA:
            if (parsedLevel < 0 || parsedLevel > 100)
                setErrorMessage("Score must be between 0 and 100.");
            else if (parsedLevel % 1 !== 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case DGNLType.VNUHCM:
            if (parsedLevel < 0 || parsedLevel > 1200)
                setErrorMessage("Score must be between 0 and 1200.");
            else if (parsedLevel % 1 !== 0)
                setErrorMessage("Score must be a whole number.");
            break;
    }
}
