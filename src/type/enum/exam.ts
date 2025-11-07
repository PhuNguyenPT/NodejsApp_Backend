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
export function isCCNNType(examType: ExamType): examType is CCNNType {
    return (CCNNTypes as readonly ExamType[]).includes(examType);
}

export function isCCQTType(examType: ExamType): examType is CCQTType {
    return (CCQTTypes as readonly ExamType[]).includes(examType);
}

export function isDGNLType(examType: ExamType): examType is DGNLType {
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

    if (examType === ExamType.A_Level) {
        const validGrades = ["A", "A*", "B", "C", "D", "E", "F", "N", "O", "U"];
        if (!validGrades.includes(level.toUpperCase())) {
            setErrorMessage(`Level must be one of: ${validGrades.join(", ")}.`);
        }
        return errors;
    }

    // Handle JLPT separately
    if (examType === ExamType.JLPT) {
        const validJLPTGrades = ["N1", "N2", "N3"];
        if (!validJLPTGrades.includes(level.toUpperCase())) {
            setErrorMessage(
                `Level must be one of: ${validJLPTGrades.join(", ")}`,
            );
        }
        return errors;
    }

    const parsedLevel = parseFloat(level);
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

function getDecimalPlaces(num: number): number {
    if (Number.isInteger(num)) return 0;
    const decimalPart = num.toString().split(".")[1];
    return decimalPart ? decimalPart.length : 0;
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
        case ExamType.IELTS:
            if (parsedLevel < 1 || parsedLevel > 9)
                setErrorMessage("Score must be between 1 and 9.");
            else if ((parsedLevel * 2) % 1 !== 0)
                setErrorMessage(
                    "Score must be in 0.5 increments (e.g., 6.5, 7.0, 7.5).",
                );
            break;
        case ExamType.TOEFL_CBT:
            if (parsedLevel < 33 || parsedLevel > 300)
                setErrorMessage("Score must be between 33 and 300.");
            else if (getDecimalPlaces(parsedLevel) > 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case ExamType.TOEFL_iBT:
            if (parsedLevel < 0 || parsedLevel > 120)
                setErrorMessage("Score must be between 0 and 120.");
            else if (getDecimalPlaces(parsedLevel) > 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case ExamType.TOEFL_Paper:
            if (parsedLevel < 310 || parsedLevel > 677)
                setErrorMessage("Score must be between 310 and 677.");
            else if (getDecimalPlaces(parsedLevel) > 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case ExamType.TOEIC:
            if (parsedLevel < 60 || parsedLevel > 990)
                setErrorMessage("Score must be between 60 and 990.");
            else if (parsedLevel % 5 !== 0)
                setErrorMessage("Score must be a multiple of 5.");
            break;
        // JLPT is handled as a string score, so it's not in this numeric switch
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
        case ExamType.ACT:
            if (parsedLevel < 1 || parsedLevel > 36)
                setErrorMessage("Score must be between 1 and 36.");
            else if (getDecimalPlaces(parsedLevel) > 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case ExamType.Duolingo_English_Test:
            if (parsedLevel < 10 || parsedLevel > 160)
                setErrorMessage("Score must be between 10 and 160.");
            else if (parsedLevel % 5 !== 0)
                setErrorMessage("Score must be a multiple of 5.");
            break;
        case ExamType.IB:
            if (parsedLevel < 0 || parsedLevel > 45)
                setErrorMessage("Score must be between 0 and 45.");
            else if (getDecimalPlaces(parsedLevel) > 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case ExamType.OSSD:
            if (parsedLevel < 0 || parsedLevel > 100)
                setErrorMessage("Score must be between 0 and 100.");
            else if (getDecimalPlaces(parsedLevel) > 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case ExamType.PTE_Academic:
            if (parsedLevel < 10 || parsedLevel > 90)
                setErrorMessage("Score must be between 10 and 90.");
            else if (getDecimalPlaces(parsedLevel) > 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case ExamType.SAT:
            if (parsedLevel < 400 || parsedLevel > 1600)
                setErrorMessage("Score must be between 400 and 1600.");
            else if (parsedLevel % 10 !== 0)
                setErrorMessage("Score must be a multiple of 10.");
            break;
        // A_Level is handled as a string score, so it's not in this numeric switch
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
        case ExamType.HSA:
            if (parsedLevel < 0 || parsedLevel > 150)
                setErrorMessage("Score must be between 0 and 150.");
            else if (getDecimalPlaces(parsedLevel) > 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case ExamType.TSA:
            if (parsedLevel < 0 || parsedLevel > 100)
                setErrorMessage("Score must be between 0 and 100.");
            else if (getDecimalPlaces(parsedLevel) > 0)
                setErrorMessage("Score must be a whole number.");
            break;
        case ExamType.VNUHCM:
            if (parsedLevel < 0 || parsedLevel > 1200)
                setErrorMessage("Score must be between 0 and 1200.");
            else if (getDecimalPlaces(parsedLevel) > 0)
                setErrorMessage("Score must be a whole number.");
            break;
    }
}
