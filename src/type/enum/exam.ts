import { ValidationException } from "../exception/validation.exception.js";

export enum CCNNType {
    IELTS = "IELTS",
    OTHER = "Other",
    TOEFL_CBT = "TOEFL CBT",
    TOEFL_iBT = "TOEFL iBT",
    TOEFL_Paper = "TOEFL Paper",
    TOEIC = "TOEIC",
}

export enum CCQTType {
    "A-Level" = "Alevel",
    ACT = "ACT",
    "Duolingo English Test" = "DoulingoEnglishTest",
    IB = "IB",
    OSSD = "OSSD",
    OTHER = "Other",
    "PTE Academic" = "PTEAcademic",
    SAT = "SAT",
}

export enum DGNLType {
    HSA = "HSA",
    OTHER = "Other",
    TSA = "TSA",
    VNUHCM = "VNUHCM",
}

export type ExamType =
    | { type: "CCNN"; value: CCNNType }
    | { type: "CCQT"; value: CCQTType }
    | { type: "DGNL"; value: DGNLType };

/**
 * Handles the validation of a single exam score/level and throws ValidationException if errors exist.
 * @param examType - The type of the exam.
 * @param level - The score or level of the exam as a string.
 * @param prefix - An optional prefix to add to the error key (e.g., 'aptitudeTestScore').
 * @throws ValidationException if the exam score/level is invalid.
 */
export function handleExamValidation(
    examType: ExamType,
    level: string,
    prefix?: string, // Added optional prefix parameter
): void {
    // validateExamTypeScore now returns specific error messages or undefined
    const validationResults: Record<string, string | undefined> =
        validateExamTypeScore(examType, level);

    const stringValidationErrors: Record<string, string> = {};
    for (const key in validationResults) {
        // If a specific error message exists for the key, add it to the errors to be thrown
        if (validationResults[key]) {
            // Apply prefix if provided
            const prefixedKey = prefix ? `${prefix}.${key}` : key;
            stringValidationErrors[prefixedKey] = validationResults[key];
        }
    }

    if (Object.keys(stringValidationErrors).length > 0) {
        throw new ValidationException(stringValidationErrors);
    }
}

/**
 * Validates an exam's score/level based on its type and provides specific error messages.
 * @param examType - The type of the exam.
 * @param level - The score or level of the exam as a string.
 * @returns A record object where keys are field names (e.g., 'level') and values are
 * either an error message string if invalid, or `undefined` if valid.
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
    if (examType.type === "CCQT" && examType.value === CCQTType["A-Level"]) {
        const validGrades = ["A", "A*", "B", "C", "D", "E", "F", "N", "O", "U"];
        if (!validGrades.includes(level.toUpperCase())) {
            setErrorMessage(`Level must be one of: ${validGrades.join(", ")}.`);
        }
        return errors;
    }

    // 'OTHER' types are considered valid by default and may not have a numeric level
    if (examType.value.toUpperCase().includes("OTHER")) {
        return errors;
    }

    // For all other exams, the level must be a valid number
    const parsedLevel = parseFloat(level);
    if (isNaN(parsedLevel)) {
        setErrorMessage("Level must be a valid number.");
        return errors; // Return early if not a number, as range checks won't apply
    }

    switch (examType.type) {
        case "CCNN": {
            switch (examType.value) {
                case CCNNType.IELTS:
                    if (parsedLevel < 1 || parsedLevel > 9)
                        setErrorMessage("Score must be between 1 and 9.");
                    break;
                case CCNNType.TOEFL_CBT:
                    if (parsedLevel < 33 || parsedLevel > 300)
                        setErrorMessage("Score must be between 33 and 300.");
                    break;
                case CCNNType.TOEFL_iBT:
                    if (parsedLevel < 0 || parsedLevel > 120)
                        setErrorMessage("Score must be between 0 and 120.");
                    break;
                case CCNNType.TOEFL_Paper:
                    if (parsedLevel < 310 || parsedLevel > 677)
                        setErrorMessage("Score must be between 310 and 677.");
                    break;
                case CCNNType.TOEIC:
                    if (parsedLevel < 60 || parsedLevel > 990)
                        setErrorMessage("Score must be between 60 and 990.");
                    break;
                default:
                    setErrorMessage("Invalid score for this CCNN exam type.");
                    break;
            }
            break;
        }
        case "CCQT": {
            switch (examType.value) {
                case CCQTType.ACT:
                    if (parsedLevel < 1 || parsedLevel > 36)
                        setErrorMessage("Score must be between 1 and 36.");
                    break;
                case CCQTType.IB:
                    if (parsedLevel < 0 || parsedLevel > 45)
                        setErrorMessage("Score must be between 0 and 45.");
                    break;
                case CCQTType.OSSD:
                    if (parsedLevel < 0 || parsedLevel > 100)
                        setErrorMessage("Score must be between 0 and 100.");
                    break;
                case CCQTType.SAT:
                    if (parsedLevel < 400 || parsedLevel > 1600)
                        setErrorMessage("Score must be between 400 and 1600.");
                    break;
                case CCQTType["Duolingo English Test"]:
                    if (parsedLevel < 10 || parsedLevel > 160)
                        setErrorMessage("Score must be between 10 and 160.");
                    break;
                case CCQTType["PTE Academic"]:
                    if (parsedLevel < 10 || parsedLevel > 90)
                        setErrorMessage("Score must be between 10 and 90.");
                    break;
                default:
                    setErrorMessage("Invalid score for this CCQT exam type.");
                    break;
            }
            break;
        }
        case "DGNL": {
            switch (examType.value) {
                case DGNLType.HSA:
                    if (parsedLevel < 0 || parsedLevel > 150)
                        setErrorMessage("Score must be between 0 and 150.");
                    break;
                case DGNLType.TSA:
                    if (parsedLevel < 0 || parsedLevel > 100)
                        setErrorMessage("Score must be between 0 and 100.");
                    break;
                case DGNLType.VNUHCM:
                    if (parsedLevel < 0 || parsedLevel > 1200)
                        setErrorMessage("Score must be between 0 and 1200.");
                    break;
                default:
                    setErrorMessage("Invalid score for this DGNL exam type.");
                    break;
            }
            break;
        }
    }

    return errors;
}
