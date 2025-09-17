// src/middleware/query-validation.middleware.ts
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";

import { ValidationException } from "@/type/exception/validation.exception.js";

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

function validateQuery<T extends object>(type: ClassConstructor<T>) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        void (async () => {
            try {
                // Transform query parameters instead of body
                const dto = plainToInstance(type, req.query, {
                    enableImplicitConversion: true,
                    excludeExtraneousValues: false,
                });

                const errors: ValidationError[] = await validate(dto, {
                    forbidNonWhitelisted: false, // More lenient for query params
                    skipMissingProperties: true, // Query params are often optional
                    skipNullProperties: false,
                    skipUndefinedProperties: true,
                    stopAtFirstError: false,
                    whitelist: true,
                });

                if (errors.length > 0) {
                    const formattedErrors = formatValidationErrors(errors);
                    throw new ValidationException(formattedErrors);
                }

                next();
            } catch (error: unknown) {
                next(error);
            }
        })();
    };
}

export { validateQuery };
