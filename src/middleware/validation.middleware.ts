// src/middleware/validation.middleware.ts
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";

import HttpException from "@/type/exception/http.exception.js";
import ValidationException from "@/type/exception/validation.exception.js";

function validationMiddleware<T extends object>(
  type: ClassConstructor<T>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate that req.body exists and is an object
    if (!req.body || typeof req.body !== "object") {
      const httpException = new HttpException(400, "Invalid request body");
      next(httpException);
      return;
    }

    try {
      // Transform plain object to DTO class instance
      const dto = plainToInstance(type, req.body as Record<string, unknown>);

      // Validate the DTO instance
      validate(dto)
        .then((errors) => {
          if (errors.length > 0) {
            // Create a structured validation errors object
            const validationErrors: Record<string, string> = {};

            errors.forEach((error) => {
              const field = error.property;
              const messages = Object.values(error.constraints ?? {});
              validationErrors[field] = messages.join(", ");
            });

            // Use ValidationException instead of HttpException
            next(
              new ValidationException(validationErrors, "Validation failed"),
            );
            return;
          } else {
            // Replace req.body with the validated and transformed DTO instance
            req.body = dto;
            next();
          }
        })
        .catch((error: unknown) => {
          console.error("Validation error:", error);
          next(new HttpException(500, "Validation error"));
        });
    } catch (error: unknown) {
      console.error("DTO transformation error:", error);
      next(new HttpException(400, "Invalid request format"));
    }
  };
}

export default validationMiddleware;
