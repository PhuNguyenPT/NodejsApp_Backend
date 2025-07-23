// src/handler/global.exception.handler.ts
import { ExceptionHandler } from "@/decorator/exception.handler.decorator.js";
import { EntityExistsException } from "@/type/exception/entity.exists.exception";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception";
import { ExpiredJwtException } from "@/type/exception/expire.jwt.exception";
import { HttpException } from "@/type/exception/http.exception";
import { InvalidArgumentException } from "@/type/exception/invalid.argument.exception";
import { InvalidUuidException } from "@/type/exception/invalid.uuid.exception";
import { ValidationException } from "@/type/exception/validation.exception";
import { ErrorDetails } from "@/type/interface/error.details";
import { ErrorResponse } from "@/type/interface/error.response";
import { ValidationResponse } from "@/type/interface/validation.response";
import logger from "@/util/logger";
// Use a class but instantiate it to avoid ESLint error
class ExceptionHandlers {
    @ExceptionHandler(EntityExistsException)
    handleEntityExistsException(
        exception: EntityExistsException,
    ): ErrorDetails {
        const status: number = exception.status;
        const message: string = exception.message;

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("EntityExistsException", {
            message,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(EntityNotFoundException)
    handleEntityNotFoundException(
        exception: EntityNotFoundException,
    ): ErrorDetails {
        const status: number = exception.status;
        const message: string = exception.message;

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
            originalError: error.name,
            stack: error.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(HttpException)
    handleHttpException(exception: HttpException): ErrorDetails {
        const status = Number(exception.status) || 500;
        const message = String(exception.message) || "Something went wrong";

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("HttpException", {
            message,
            stack: exception.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(InvalidArgumentException)
    handleInvalidArgumentException(exception: InvalidArgumentException) {
        const status = exception.status;
        const message = exception.message;

        const response: ErrorResponse = {
            message,
            status,
        };
        logger.warn("InvalidArgumentException", {
            message,
            status,
        });
        return { message, response, status };
    }

    @ExceptionHandler(InvalidUuidException)
    handleInvalidUuidException(exception: InvalidUuidException): ErrorDetails {
        const status = exception.status;
        const message = exception.message;

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

    @ExceptionHandler(ExpiredJwtException)
    handleJsonWebTokenError(exception: ExpiredJwtException): ErrorDetails {
        const status = exception.status;
        const message = exception.message;

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("ExpiredJwtException", {
            message,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(SyntaxError)
    handleSyntaxError(error: SyntaxError): ErrorDetails {
        const status = 400;
        const message = "Invalid request format or malformed data";

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("SyntaxError", {
            message: error.message,
            originalError: error.name,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(ValidationException)
    handleValidationException(exception: ValidationException): ErrorDetails {
        const status = exception.status;
        const message = exception.message;

        const response: ValidationResponse = {
            message,
            status,
            validationErrors: exception.validationErrors,
        };

        logger.warn("ValidationException", {
            message,
            stack: exception.stack,
            status,
            validationErrors: exception.validationErrors,
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
