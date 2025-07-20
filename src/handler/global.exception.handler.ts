// src/handler/global.exception.handler.ts
import { ExceptionHandler } from "@/decorator/exception.handler.decorator.js";
import { HttpException } from "@/type/exception/http.exception";
import { InvalidUuidException } from "@/type/exception/invalid.uuid.exception";
import { EntityNotFoundException } from "@/type/exception/user.not.found.exception";
import { ValidationException } from "@/type/exception/validation.exception";
import { ErrorDetails } from "@/type/interface/error.details";
import { ErrorResponse } from "@/type/interface/error.response";
import { ValidationResponse } from "@/type/interface/validation.response";
import logger from "@/util/logger";

// Use a class but instantiate it to avoid ESLint error
class ExceptionHandlers {
    @ExceptionHandler(EntityNotFoundException)
    handleEntityNotFoundException(
        error: EntityNotFoundException,
    ): ErrorDetails {
        const status: number = error.status;
        const message: string = error.message;

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("EntityNotFoundException", {
            message,
            status,
        });

        return { message, response, status };
    }

    handleGenericError(error: Error): ErrorDetails {
        const status = 500;
        const message = error.message || "Something went wrong";

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.error("Unhandled error", {
            message,
            stack: error.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(HttpException)
    handleHttpException(error: HttpException): ErrorDetails {
        const status = Number(error.status) || 500;
        const message = String(error.message) || "Something went wrong";

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.error("HTTP error occurred", {
            message,
            stack: error.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(InvalidUuidException)
    handleInvalidUuidException(error: InvalidUuidException): ErrorDetails {
        const status = error.status;
        const message = error.message;

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("InvalidUuidException", {
            message,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(ValidationException)
    handleValidationException(error: ValidationException): ErrorDetails {
        const status = error.status;
        const message = error.message;

        const response: ValidationResponse = {
            message,
            status,
            validationErrors: error.validationErrors,
        };

        logger.error("Validation error occurred", {
            message,
            stack: error.stack,
            status,
            validationErrors: error.validationErrors,
        });

        return { message, response, status };
    }
}

// Create an instance to avoid "only static properties" ESLint error
const exceptionHandlers = new ExceptionHandlers();

// Export the generic error handler with proper typing
export const handleGenericError = (error: Error): ErrorDetails => {
    return exceptionHandlers.handleGenericError(error);
};

// Also export the class instance if needed elsewhere
export const GlobalExceptionHandler = exceptionHandlers;
