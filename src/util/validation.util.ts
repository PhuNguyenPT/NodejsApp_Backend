// src/util/validation.util.ts
import { ValidationError } from "class-validator";

/**
 * Formats class-validator ValidationError array into a flat Record<string, string>
 * Handles nested validation errors recursively
 */
export function formatValidationErrors(
    errors: ValidationError[],
): Record<string, string> {
    const formattedErrors: Record<string, string> = {};

    for (const error of errors) {
        if (error.children && error.children.length > 0) {
            const nestedErrors = formatValidationErrors(error.children);
            for (const key in nestedErrors) {
                formattedErrors[`${error.property}.${key}`] = nestedErrors[key];
            }
        } else if (error.constraints) {
            formattedErrors[error.property] = Object.values(
                error.constraints,
            ).join(", ");
        }
    }
    return formattedErrors;
}
