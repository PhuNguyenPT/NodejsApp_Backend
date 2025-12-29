import type { NextFunction, Request, Response } from "express";

// src/middleware/validation.middleware.ts
import { type ClassConstructor, plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";

import { DEFAULT_VALIDATOR_OPTIONS } from "@/config/validator.config.js";
import { ValidationException } from "@/type/exception/validation.exception.js";

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
 * Creates a validation middleware that actually works with TSOA.
 * This properly handles async validation and prevents invalid data from passing through.
 */
function validateDTO<T extends object>(type: ClassConstructor<T>) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        // Use an async IIFE to handle the validation - explicitly void it to satisfy ESLint
        void (async () => {
            try {
                // Transform the plain request body to an instance of the DTO class
                const dto = plainToInstance(type, req.body, {
                    excludeExtraneousValues: false,
                });

                // Validate the DTO instance with strict settings
                const errors: ValidationError[] = await validate(
                    dto,
                    DEFAULT_VALIDATOR_OPTIONS,
                );

                if (errors.length > 0) {
                    const formattedErrors = formatValidationErrors(errors);

                    // Throw the validation exception to stop the request
                    throw new ValidationException(formattedErrors);
                }

                // Don't modify req.body - let TSOA handle the transformation
                next();
            } catch (error: unknown) {
                next(error);
            }
        })();
    };
}

export default validateDTO;
