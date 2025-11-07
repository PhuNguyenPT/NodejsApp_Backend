import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from "class-validator";

import { ExamSubject } from "@/dto/student/exam.dto.js";
import {
    isTalentExamSubjects,
    TalentExamSubjects,
} from "@/type/enum/talent-exam.js";

export function IsTalentSubject(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: "isTalentSubject",
            options: validationOptions,
            propertyName: propertyName,
            target: object.constructor,
            validator: {
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be one of the following values: ${TalentExamSubjects.join(", ")}`;
                },
                validate(value: unknown): boolean {
                    // Let @IsArray handle non-array values
                    if (!Array.isArray(value)) return true;

                    // Check if all items are valid ExamSubjects with talent subjects
                    return value.every((item) => {
                        if (!isExamSubject(item)) return false;
                        return isTalentExamSubjects(item.name);
                    });
                },
            },
        });
    };
}

// Type guard function
function isExamSubject(obj: unknown): obj is ExamSubject {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "name" in obj &&
        "score" in obj
    );
}
