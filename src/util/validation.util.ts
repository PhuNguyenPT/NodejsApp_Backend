// src/util/validation.util.ts

import { ClassConstructor, plainToInstance } from "class-transformer";
import {
    validate,
    validateSync,
    ValidationError,
    ValidatorOptions,
} from "class-validator";

import { ValidationException } from "@/type/exception/validation.exception.js";

/**
 * Default validator options for permissive validation.
 * Allows extra properties from entities while still validating decorated fields.
 */
const DEFAULT_VALIDATOR_OPTIONS: ValidatorOptions = {
    forbidNonWhitelisted: false, // Don't throw error for extra properties
    skipMissingProperties: false, // Still validate required properties
    skipNullProperties: false, // Validate null values
    skipUndefinedProperties: false, // Validate undefined values
    stopAtFirstError: false, // Get all errors
    whitelist: false, // Don't strip non-whitelisted properties
};

/**
 * Recursively formats validation errors from class-validator into a simple
 * key-value object. Handles nested DTOs by creating dot-notation keys.
 */
const formatValidationErrors = (
    errors: ValidationError[],
): Record<string, string> => {
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
};

/**
 * Transforms plain object to class instance and validates it asynchronously.
 * Throws ValidationException if validation fails.
 *
 * @param type - The class constructor to transform to
 * @param plain - The plain object to transform
 * @returns The validated DTO instance
 * @throws ValidationException if validation fails
 */
export async function validateAndTransform<T extends object>(
    type: ClassConstructor<T>,
    plain: object,
): Promise<T> {
    // Transform the plain object to an instance of the DTO class
    const dto = plainToInstance(type, plain);

    // Validate the DTO instance - only validate decorated properties
    const errors: ValidationError[] = await validate(
        dto,
        DEFAULT_VALIDATOR_OPTIONS,
    );

    if (errors.length > 0) {
        const formattedErrors = formatValidationErrors(errors);
        throw new ValidationException(formattedErrors);
    }

    return dto;
}

/**
 * Transforms plain object to class instance and validates it synchronously.
 * Throws ValidationException if validation fails.
 *
 * Note: This uses synchronous validation and won't work with async validators.
 * Use validateAndTransform() if you need async validation support.
 *
 * @param type - The class constructor to transform to
 * @param plain - The plain object to transform
 * @returns The validated DTO instance
 * @throws ValidationException if validation fails
 */
export function validateAndTransformSync<T extends object>(
    type: ClassConstructor<T>,
    plain: object,
): T {
    // Transform the plain object to an instance of the DTO class
    const dto = plainToInstance(type, plain);

    // Validate the DTO instance synchronously - only validate decorated properties
    const errors: ValidationError[] = validateSync(
        dto,
        DEFAULT_VALIDATOR_OPTIONS,
    );

    if (errors.length > 0) {
        const formattedErrors = formatValidationErrors(errors);
        throw new ValidationException(formattedErrors);
    }

    return dto;
}
