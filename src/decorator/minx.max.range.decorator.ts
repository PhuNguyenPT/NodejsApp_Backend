import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from "class-validator";

// Generic interface for objects with min/max budget properties
export interface MinMaxRange {
    maxBudget: number;
    minBudget: number;
}

// Type-safe custom validator
export function IsMinLessThanOrEqualMax<T extends MinMaxRange>(
    validationOptions?: ValidationOptions,
) {
    return function (target: T, propertyName: keyof T) {
        registerDecorator({
            name: "isMinLessThanOrEqualMax",
            options: validationOptions,
            propertyName: propertyName as string,
            target: target.constructor,
            validator: {
                defaultMessage(args: ValidationArguments): string {
                    return `${args.property} must be less than or equal to maxBudget`;
                },

                validate(value: unknown, args: ValidationArguments): boolean {
                    // Type-safe casting with proper interface constraint
                    const budgetObject = args.object as MinMaxRange;

                    // Type guards to ensure both values are numbers
                    if (typeof value !== "number") {
                        return true; // Let @IsNumber() handle this
                    }

                    if (typeof budgetObject.maxBudget !== "number") {
                        return true; // Let other validators handle maxBudget validation
                    }

                    // Now we know both are numbers - safe to compare
                    return value <= budgetObject.maxBudget;
                },
            },
        });
    };
}
