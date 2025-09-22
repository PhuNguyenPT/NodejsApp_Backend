import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from "class-validator";

import {
    FOREIGN_LANGUAGES,
    NGOAI_NGU,
    VALID_EXAM_COMBINATIONS,
} from "@/type/enum/national-exam-subject.js";
import {
    CORE_SUBJECTS,
    isCoreSubject,
    VietnameseSubject,
} from "@/type/enum/subject.js";

// Detailed validator with specific error messages
export function IsValidNationalExamSubjects(
    validationOptions?: ValidationOptions,
) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: "isValidNationalExamCombinationDetailed",
            options: validationOptions,
            propertyName: propertyName,
            target: object.constructor,
            validator: {
                defaultMessage(args: ValidationArguments) {
                    const value: unknown = args.value;

                    if (!Array.isArray(value)) {
                        return `${args.property} must be an array`;
                    }

                    if (value.length !== 4) {
                        return `${args.property} must contain exactly 4 subjects, but got ${value.length.toString()}`;
                    }

                    const subjectNames = value
                        .map((item) => {
                            if (hasNameProperty(item)) {
                                return item.name;
                            }
                            return null;
                        })
                        .filter((name): name is string => name !== null);

                    if (subjectNames.length !== 4) {
                        return `${args.property} must contain valid subject objects with 'name' property`;
                    }

                    // Check for required subjects
                    if (!subjectNames.includes(VietnameseSubject.TOAN)) {
                        return `${args.property} must include mandatory subject: ${VietnameseSubject.TOAN}`;
                    }

                    if (!subjectNames.includes(VietnameseSubject.NGU_VAN)) {
                        return `${args.property} must include mandatory subject: ${VietnameseSubject.NGU_VAN}`;
                    }

                    // Check for invalid subjects
                    const invalidSubjects = subjectNames.filter(
                        (name) =>
                            typeof name !== "string" ||
                            !isCoreSubject(name as VietnameseSubject),
                    );

                    if (invalidSubjects.length > 0) {
                        const allowedValues = CORE_SUBJECTS.join(", ");
                        return `${args.property} contains invalid subjects: ${invalidSubjects.join(", ")}. Allowed values: ${allowedValues}`;
                    }

                    // Check for duplicates
                    const uniqueSubjects = new Set(subjectNames);
                    if (uniqueSubjects.size !== subjectNames.length) {
                        return `${args.property} must have unique subject names`;
                    }

                    // Check if combination is valid
                    if (
                        !isValidCombination(subjectNames as VietnameseSubject[])
                    ) {
                        return `${args.property} is not a valid combination for Vietnamese high school graduation. The combination [${subjectNames.join(", ")}] is not among the ${VALID_EXAM_COMBINATIONS.length.toString()} approved combinations`;
                    }

                    return `${args.property} validation failed`;
                },
                validate(value: unknown, _args: ValidationArguments) {
                    if (!Array.isArray(value) || value.length !== 4) {
                        return false;
                    }

                    const subjectNames = value
                        .map((item) => {
                            if (hasNameProperty(item)) {
                                return item.name;
                            }
                            return null;
                        })
                        .filter((name): name is string => name !== null);

                    if (subjectNames.length !== 4) return false;

                    const allValidSubjects = subjectNames.every(
                        (name) =>
                            typeof name === "string" &&
                            isCoreSubject(name as VietnameseSubject),
                    );

                    const uniqueSubjects = new Set(subjectNames);
                    const hasUniqueSubjects =
                        uniqueSubjects.size === subjectNames.length;

                    return (
                        allValidSubjects &&
                        hasUniqueSubjects &&
                        isValidCombination(subjectNames as VietnameseSubject[])
                    );
                },
            },
        });
    };
}

// Type guard to check if a value has a name property
function hasNameProperty(obj: unknown): obj is { name: string } {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "name" in obj &&
        typeof (obj as Record<string, unknown>).name === "string"
    );
}

// Helper function to check if a combination matches any valid pattern
function isValidCombination(subjects: VietnameseSubject[]): boolean {
    if (subjects.length !== 4) return false;

    // Always ensure Toán and Ngữ Văn are present
    if (
        !subjects.includes(VietnameseSubject.TOAN) ||
        !subjects.includes(VietnameseSubject.NGU_VAN)
    ) {
        return false;
    }

    // Normalize foreign languages in the input and sort for comparison
    const normalizedSubjects = subjects.map(normalizeForeignLanguage).sort();

    // Check against all valid combinations
    return VALID_EXAM_COMBINATIONS.some((validCombo) => {
        const normalizedValidCombo = validCombo
            .map((subject) => (subject === NGOAI_NGU ? NGOAI_NGU : subject))
            .sort();
        return (
            JSON.stringify(normalizedSubjects) ===
            JSON.stringify(normalizedValidCombo)
        );
    });
}

// Helper function to normalize foreign language subjects for comparison
function normalizeForeignLanguage(
    subject: VietnameseSubject,
): typeof NGOAI_NGU | VietnameseSubject {
    return (FOREIGN_LANGUAGES as readonly VietnameseSubject[]).includes(subject)
        ? NGOAI_NGU
        : subject;
}
