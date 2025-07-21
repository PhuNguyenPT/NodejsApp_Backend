// src/middleware/validation.middleware.ts
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";

import { ValidationException } from "@/type/exception/validation.exception.js";

/**
 * Recursively formats validation errors from class-validator into a simple
 * key-value object. Handles nested DTOs by creating dot-notation keys.
 * @param errors The array of ValidationError objects.
 * @returns A record of field names to error messages.
 */
const formatValidationErrors = (
    errors: ValidationError[],
): Record<string, string> => {
    const formattedErrors: Record<string, string> = {};

    for (const error of errors) {
        // Handle nested errors (e.g., for a nested DTO)
        if (error.children && error.children.length > 0) {
            const nestedErrors = formatValidationErrors(error.children);
            for (const key in nestedErrors) {
                formattedErrors[`${error.property}.${key}`] = nestedErrors[key];
            }
        } else if (error.constraints) {
            // Handle top-level errors
            formattedErrors[error.property] = Object.values(
                error.constraints,
            ).join(", ");
        }
    }
    return formattedErrors;
};

/**
 * Creates an Express middleware to validate and transform the request body
 * against a given DTO class.
 * @param type The DTO class to validate against.
 */
function validateDTO<T extends object>(type: ClassConstructor<T>) {
    // This function is no longer async
    return (req: Request, res: Response, next: NextFunction): void => {
        // Transform the plain request body to an instance of the DTO class
        const dto = plainToInstance(type, req.body);

        // Validate the DTO instance and handle the promise
        validate(dto, {
            forbidNonWhitelisted: true,
            whitelist: true,
        })
            .then((errors) => {
                if (errors.length > 0) {
                    const formattedErrors = formatValidationErrors(errors);
                    // Pass a structured validation error to the global error handler
                    next(new ValidationException(formattedErrors));
                } else {
                    // The DTO is valid, replace req.body with the validated instance
                    req.body = dto;
                    next();
                }
            })
            .catch((error: unknown) => {
                // Forward any other unexpected errors
                next(error);
            });
    };
}

export default validateDTO;
