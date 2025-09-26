// src/middleware/uuid.validation.middleware.ts
import { NextFunction, Request, Response } from "express";
import { validate as validateUuid } from "uuid";

import { InvalidUuidException } from "@/type/exception/invalid-uuid.exception.js";

/**
 * Creates a middleware function that validates one or more UUID route parameters.
 * @param paramNames - A list of parameter names to validate.
 * @returns An Express middleware function.
 */
export const validateUuidParams = (...paramNames: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        // Ensure at least one parameter name is provided
        if (paramNames.length === 0) {
            next(new Error("Server configuration error in UUID validation."));
            return;
        }

        for (const paramName of paramNames) {
            const paramValue = req.params[paramName];

            // 1. Check if the parameter exists on the request
            if (!paramValue) {
                next(new Error(`Route parameter '${paramName}' is required.`));
                return; // Stop processing on the first error
            }

            // 2. Check if the parameter value is a valid UUID
            if (!validateUuid(paramValue)) {
                // Pass a more descriptive error message
                next(
                    new InvalidUuidException(
                        `The value provided for '${paramName}' is not a valid UUID.`,
                    ),
                );
                return; // Stop processing on the first error
            }
        }

        // If the loop completes, all specified params are valid
        next();
    };
};
