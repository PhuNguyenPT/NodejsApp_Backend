// src/middleware/uuid.validation.middleware.ts
import { NextFunction, Request, Response } from "express";
import { validate as validateUuid } from "uuid";

import { InvalidUuidException } from "@/type/exception/invalid.uuid.exception.js";

/**
 * Creates a middleware function that validates UUID parameters
 * @param paramName - The name of the parameter to validate (defaults to 'uuid')
 * @returns Express middleware function
 */
export const validateUuidParam = (paramName = "uuid") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const paramValue = req.params[paramName];

    if (!paramValue) {
      next(new Error(`${paramName} parameter is required`));
      return;
    }

    if (!validateUuid(paramValue)) {
      next(new InvalidUuidException());
      return;
    }

    next();
  };
};

// Convenience middleware for id validation
export const validationUUID = validateUuidParam("id");
