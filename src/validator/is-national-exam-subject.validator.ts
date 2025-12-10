import {
    registerDecorator,
    type ValidationArguments,
    type ValidationOptions,
} from "class-validator";

import {
    isNationalExamSubjects,
    NationalExamSubjects,
} from "@/type/enum/national-exam-subject.js";
import { VietnameseSubject } from "@/type/enum/subject.js";

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
                            !isNationalExamSubjects(name as VietnameseSubject),
                    );

                    if (invalidSubjects.length > 0) {
                        const allowedValues = NationalExamSubjects.join(", ");
                        return `${args.property} contains invalid subjects: ${invalidSubjects.join(", ")}. Allowed values: ${allowedValues}`;
                    }

                    // Check for duplicates
                    const uniqueSubjects = new Set(subjectNames);
                    if (uniqueSubjects.size !== subjectNames.length) {
                        return `${args.property} must have unique subject names`;
                    }

                    // Check for invalid technology combination
                    const electives = subjectNames.filter(
                        (s) =>
                            (s as VietnameseSubject) !==
                                VietnameseSubject.TOAN &&
                            (s as VietnameseSubject) !==
                                VietnameseSubject.NGU_VAN,
                    );

                    if (
                        electives.includes(
                            VietnameseSubject.CONG_NGHE_CONG_NGHIEP,
                        ) &&
                        electives.includes(
                            VietnameseSubject.CONG_NGHE_NONG_NGHIEP,
                        )
                    ) {
                        return `${args.property} cannot contain both ${VietnameseSubject.CONG_NGHE_CONG_NGHIEP} and ${VietnameseSubject.CONG_NGHE_NONG_NGHIEP} as electives`;
                    }

                    // Check if combination is valid
                    if (
                        !isValidCombination(subjectNames as VietnameseSubject[])
                    ) {
                        return `${args.property} is not a valid combination for Vietnamese high school graduation. Must include ${VietnameseSubject.TOAN} and ${VietnameseSubject.NGU_VAN}, plus 2 different valid elective subjects.`;
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
                            isNationalExamSubjects(name as VietnameseSubject),
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

    // Check mandatory subjects
    if (
        !subjects.includes(VietnameseSubject.TOAN) ||
        !subjects.includes(VietnameseSubject.NGU_VAN)
    ) {
        return false;
    }

    // Get the 2 elective subjects
    const electives = subjects.filter(
        (s) => s !== VietnameseSubject.TOAN && s !== VietnameseSubject.NGU_VAN,
    );

    // Must have exactly 2 electives, both valid, and different from each other
    if (
        electives.length !== 2 ||
        electives[0] === electives[1] ||
        !electives.every((s) => isNationalExamSubjects(s))
    ) {
        return false;
    }

    // Check that both technology subjects are not selected together
    if (
        electives.includes(VietnameseSubject.CONG_NGHE_CONG_NGHIEP) &&
        electives.includes(VietnameseSubject.CONG_NGHE_NONG_NGHIEP)
    ) {
        return false;
    }

    return true;
}
