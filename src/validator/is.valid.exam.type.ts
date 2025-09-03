import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

import {
    CCNNType,
    CCQTType,
    DGNLType,
    ExamType,
    ExamTypeKey,
    ExamTypeValueMap,
} from "@/type/enum/exam.js";

@ValidatorConstraint({ async: false, name: "isValidExamType" })
export class IsValidExamTypeConstraint implements ValidatorConstraintInterface {
    private examType: unknown;

    defaultMessage() {
        const validationError = getExamTypeValidationError(this.examType);
        return (
            validationError ??
            "ExamType must have a valid type and value combination"
        );
    }

    validate(examType: unknown) {
        this.examType = examType;
        return isValidExamType(examType);
    }
}

// Function to get detailed validation error message with better type safety
export function getExamTypeValidationError(examType: unknown): null | string {
    if (!examType || typeof examType !== "object") {
        return "ExamType must be an object with type and value properties";
    }

    const { type, value } = examType as { type: unknown; value: unknown };

    if (!type || typeof type !== "string") {
        const validTypes: ExamTypeKey[] = ["CCNN", "CCQT", "DGNL"];
        return `ExamType.type is required and must be one of the following values: ${validTypes.join(", ")}`;
    }

    if (!value || typeof value !== "string") {
        return `ExamType.value is required`;
    }

    // Type guard to check if type is a valid ExamTypeKey
    const isValidExamTypeKey = (t: string): t is ExamTypeKey => {
        return (["CCNN", "CCQT", "DGNL"] as const).includes(t as ExamTypeKey);
    };

    if (!isValidExamTypeKey(type)) {
        const validTypes: ExamTypeKey[] = ["CCNN", "CCQT", "DGNL"];
        return `Invalid examType.type "${type}". Must be one of the following values: ${validTypes.join(", ")}`;
    }

    switch (type) {
        case "CCNN": {
            const validValues = Object.values(CCNNType);
            if (!validValues.includes(value as CCNNType)) {
                return `Invalid examType.value "${value}" for type "CCNN". Must be one of the following values: ${validValues.join(", ")}`;
            }
            break;
        }
        case "CCQT": {
            const validValues = Object.values(CCQTType);
            if (!validValues.includes(value as CCQTType)) {
                return `Invalid examType.value "${value}" for type "CCQT". Must be one of the following values: ${validValues.join(", ")}`;
            }
            break;
        }
        case "DGNL": {
            const validValues = Object.values(DGNLType);
            if (!validValues.includes(value as DGNLType)) {
                return `Invalid examType.value "${value}" for type "DGNL". Must be one of the following values: ${validValues.join(", ")}`;
            }
            break;
        }
        default: {
            const _exhaustiveCheck: never = type;
            return `Unexpected exam type: ${String(_exhaustiveCheck)}`;
        }
    }

    return null; // No error
}

// Helper function to get all valid values for a specific exam type
export function getValidValuesForExamType<T extends ExamTypeKey>(
    examType: T,
): ExamTypeValueMap[T][] {
    switch (examType) {
        case "CCNN":
            return Object.values(CCNNType) as ExamTypeValueMap[T][];
        case "CCQT":
            return Object.values(CCQTType) as ExamTypeValueMap[T][];
        case "DGNL":
            return Object.values(DGNLType) as ExamTypeValueMap[T][];
        default: {
            const _exhaustiveCheck: never = examType;
            throw new Error(
                `Unexpected exam type: ${String(_exhaustiveCheck)}`,
            );
        }
    }
}

export function isValidExamType(examType: unknown): examType is ExamType {
    if (!examType || typeof examType !== "object") {
        return false;
    }

    const { type, value } = examType as { type: unknown; value: unknown };

    if (
        !type ||
        !value ||
        typeof type !== "string" ||
        typeof value !== "string"
    ) {
        return false;
    }

    // Use type guard for better type safety
    const isValidExamTypeKey = (t: string): t is keyof ExamTypeValueMap => {
        return (["CCNN", "CCQT", "DGNL"] as const).includes(
            t as keyof ExamTypeValueMap,
        );
    };

    if (!isValidExamTypeKey(type)) {
        return false;
    }

    // Type-safe validation using mapped types
    switch (type) {
        case "CCNN":
            return Object.values(CCNNType).includes(value as CCNNType);
        case "CCQT":
            return Object.values(CCQTType).includes(value as CCQTType);
        case "DGNL":
            return Object.values(DGNLType).includes(value as DGNLType);
        default: {
            // Exhaustiveness check - TypeScript will error if we miss a case
            const _exhaustiveCheck: never = type;
            return _exhaustiveCheck;
        }
    }
}

@ValidatorConstraint({ async: false, name: "isValidCCNNExamType" })
export class IsValidCCNNExamTypeConstraint
    implements ValidatorConstraintInterface
{
    private examType: unknown;

    defaultMessage() {
        const validationError = this.getCCNNExamTypeValidationError(
            this.examType,
        );
        return validationError ?? "ExamType must be CCNN with valid values";
    }

    validate(examType: unknown) {
        this.examType = examType;
        return this.isValidCCNNExamType(examType);
    }

    private getCCNNExamTypeValidationError(examType: unknown): null | string {
        const baseError = getExamTypeValidationError(examType);
        if (baseError) {
            return baseError;
        }

        if (examType && typeof examType === "object") {
            const { type } = examType as { type: string };
            if (type !== "CCNN") {
                const validCCNNValues = Object.values(CCNNType).join(", ");
                return `ExamType must be CCNN, but got "${type}". Valid CCNN must be one of the following values: ${validCCNNValues}`;
            }
        }

        return null;
    }

    private isValidCCNNExamType(
        examType: unknown,
    ): examType is Extract<ExamType, { type: "CCNN" }> {
        if (!isValidExamType(examType)) {
            return false;
        }

        return examType.type === "CCNN";
    }
}

@ValidatorConstraint({ async: false, name: "isValidDGNLExamType" })
export class IsValidDGNLExamTypeConstraint
    implements ValidatorConstraintInterface
{
    private examType: unknown;

    defaultMessage() {
        const validationError = this.getDGNLExamTypeValidationError(
            this.examType,
        );
        return validationError ?? "ExamType must be DGNL with valid values";
    }

    validate(examType: unknown) {
        this.examType = examType;
        return this.isValidDGNLExamType(examType);
    }

    private getDGNLExamTypeValidationError(examType: unknown): null | string {
        // First, check for general validity (e.g., is the value correct for the type?)
        const baseError = getExamTypeValidationError(examType);
        if (baseError) {
            return baseError;
        }

        // Then, check if the type is specifically DGNL
        if (examType && typeof examType === "object") {
            const { type } = examType as { type: string };
            if (type !== "DGNL") {
                const validDGNLValues = Object.values(DGNLType).join(", ");
                return `ExamType must be DGNL, but got "${type}". Valid DGNL must be one of the following values: ${validDGNLValues}`;
            }
        }

        return null; // No error
    }

    private isValidDGNLExamType(
        examType: unknown,
    ): examType is Extract<ExamType, { type: "DGNL" }> {
        // Check if it's a valid exam object overall
        if (!isValidExamType(examType)) {
            return false;
        }

        // Enforce that the type must be 'DGNL'
        return examType.type === "DGNL";
    }
}

@ValidatorConstraint({ async: false, name: "isValidCCQTExamType" })
export class IsValidCCQTExamTypeConstraint
    implements ValidatorConstraintInterface
{
    private examType: unknown;

    defaultMessage() {
        const validationError = this.getCCQTExamTypeValidationError(
            this.examType,
        );
        return validationError ?? "ExamType must be CCQT with valid values";
    }

    validate(examType: unknown) {
        this.examType = examType;
        return this.isValidCCQTExamType(examType);
    }

    private getCCQTExamTypeValidationError(examType: unknown): null | string {
        const baseError = getExamTypeValidationError(examType);
        if (baseError) {
            return baseError;
        }

        if (examType && typeof examType === "object") {
            const { type } = examType as { type: string };
            if (type !== "CCQT") {
                const validCCQTValues = Object.values(CCQTType).join(", ");
                return `ExamType must be CCQT, but got "${type}". Valid CCQT must be one of the following values: ${validCCQTValues}`;
            }
        }

        return null;
    }

    private isValidCCQTExamType(
        examType: unknown,
    ): examType is Extract<ExamType, { type: "CCQT" }> {
        if (!isValidExamType(examType)) {
            return false;
        }

        return examType.type === "CCQT";
    }
}

@ValidatorConstraint({ async: false, name: "isValidCertificationExamType" })
export class IsValidCertificationExamTypeConstraint
    implements ValidatorConstraintInterface
{
    private examType: unknown;

    defaultMessage(): string {
        // First check if the type itself is disallowed for certifications
        if (
            this.examType &&
            typeof this.examType === "object" &&
            "type" in this.examType
        ) {
            const type = (this.examType as ExamType).type;
            const allowedTypes = ["CCNN", "CCQT"];
            if (!allowedTypes.includes(type)) {
                return `Invalid exam type "${type}" for certification. Must be one of the following values: ${allowedTypes.join(", ")}`;
            }
        }

        // Then check for structural/value validation errors
        const baseError = getExamTypeValidationError(this.examType);
        if (baseError) {
            return baseError;
        }

        return "ExamType for certification is invalid.";
    }

    validate(examType: unknown): boolean {
        this.examType = examType;

        // First, check if it's a structurally valid exam type (e.g., CCNN value matches CCNN type)
        if (!isValidExamType(examType)) {
            return false;
        }

        // Next, enforce that the type must ONLY be CCNN or CCQT for certifications
        return examType.type === "CCNN" || examType.type === "CCQT";
    }
}
