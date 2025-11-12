import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from "class-validator";

import {
    CCNNTypes,
    CCQTTypes,
    DGNLTypes,
    ExamType,
    isCCNNType,
    isCCQTType,
    isDGNLType,
} from "@/type/enum/exam-type.js";

@ValidatorConstraint({ async: false, name: "isValidExamType" })
export class IsValidExamTypeConstraint implements ValidatorConstraintInterface {
    private examType: unknown;

    defaultMessage() {
        const validationError = getExamTypeValidationError(this.examType);
        return validationError ?? "examType must be a valid exam type";
    }

    validate(examType: unknown) {
        this.examType = examType;
        return isValidExamType(examType);
    }
}

export function getExamTypeValidationError(examType: unknown): null | string {
    if (typeof examType !== "string") {
        return "examType must be a string";
    }

    const validExamTypes = Object.values(ExamType);
    if (!validExamTypes.includes(examType as ExamType)) {
        return `Invalid examType "${examType}". Must be one of: ${validExamTypes.join(", ")}`;
    }

    return null;
}

export function isValidExamType(examType: unknown): examType is ExamType {
    return (
        typeof examType === "string" &&
        Object.values(ExamType).includes(examType as ExamType)
    );
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
        return validationError ?? "examType must be a valid CCNN exam type";
    }

    validate(examType: unknown) {
        this.examType = examType;
        return this.isValidCCNNExamType(examType);
    }

    private getCCNNExamTypeValidationError(examType: unknown): null | string {
        if (typeof examType !== "string") {
            return "examType must be a string";
        }

        if (!isValidExamType(examType)) {
            return `Invalid examType "${examType}"`;
        }

        if (!isCCNNType(examType)) {
            const validCCNNTypes = CCNNTypes.map((t) => t).join(", ");
            return `examType must be a CCNN type. Valid values: ${validCCNNTypes}`;
        }

        return null;
    }

    private isValidCCNNExamType(examType: unknown): examType is ExamType {
        return isValidExamType(examType) && isCCNNType(examType);
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
        return validationError ?? "examType must be a valid DGNL exam type";
    }

    validate(examType: unknown) {
        this.examType = examType;
        return this.isValidDGNLExamType(examType);
    }

    private getDGNLExamTypeValidationError(examType: unknown): null | string {
        if (typeof examType !== "string") {
            return "examType must be a string";
        }

        if (!isValidExamType(examType)) {
            return `Invalid examType "${examType}"`;
        }

        if (!isDGNLType(examType)) {
            const validDGNLTypes = DGNLTypes.map((t) => t).join(", ");
            return `examType must be a DGNL type. Valid values: ${validDGNLTypes}`;
        }

        return null;
    }

    private isValidDGNLExamType(examType: unknown): examType is ExamType {
        return isValidExamType(examType) && isDGNLType(examType);
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
        return validationError ?? "examType must be a valid CCQT exam type";
    }

    validate(examType: unknown) {
        this.examType = examType;
        return this.isValidCCQTExamType(examType);
    }

    private getCCQTExamTypeValidationError(examType: unknown): null | string {
        if (typeof examType !== "string") {
            return "examType must be a string";
        }

        if (!isValidExamType(examType)) {
            return `Invalid examType "${examType}"`;
        }

        if (!isCCQTType(examType)) {
            const validCCQTTypes = CCQTTypes.map((t) => t).join(", ");
            return `examType must be a CCQT type. Valid values: ${validCCQTTypes}`;
        }

        return null;
    }

    private isValidCCQTExamType(examType: unknown): examType is ExamType {
        return isValidExamType(examType) && isCCQTType(examType);
    }
}

@ValidatorConstraint({ async: false, name: "isValidCertificationExamType" })
export class IsValidCertificationExamTypeConstraint
    implements ValidatorConstraintInterface
{
    private examType: unknown;

    defaultMessage(): string {
        const baseError = getExamTypeValidationError(this.examType);
        if (baseError) {
            return baseError;
        }

        if (isValidExamType(this.examType) && isDGNLType(this.examType)) {
            const allowedTypes = [...CCNNTypes, ...CCQTTypes].join(", ");
            return `Invalid exam type for certification. DGNL types are not allowed. Must be one of: ${allowedTypes}`;
        }

        return "examType for certification is invalid.";
    }

    validate(examType: unknown): boolean {
        this.examType = examType;

        if (!isValidExamType(examType)) {
            return false;
        }

        // Only CCNN or CCQT allowed for certifications (no DGNL)
        return isCCNNType(examType) || isCCQTType(examType);
    }
}
