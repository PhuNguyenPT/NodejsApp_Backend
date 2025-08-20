// src/handler/global.exception.handler.ts

import jwt from "jsonwebtoken"; // Corrected import
import { ValidateError } from "tsoa";
import { EntityMetadataNotFoundError } from "typeorm";
import {
    ZodError,
    ZodInvalidEnumValueIssue,
    ZodInvalidTypeIssue,
    ZodIssue,
} from "zod";

import { ExceptionHandler } from "@/decorator/exception.handler.decorator.js";
import { HttpStatus } from "@/type/enum/http.status.js";
import { AccessDeniedException } from "@/type/exception/access.denied.exception.js";
import { AuthenticationException } from "@/type/exception/authentication.exception.js";
import { BadCredentialsException } from "@/type/exception/bad.credentials.exception.js";
import { EntityExistsException } from "@/type/exception/entity.exists.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";
import { ExpiredJwtException } from "@/type/exception/expired.jwt.exception.js";
import { HttpException } from "@/type/exception/http.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal.argument.exception.js";
import { InvalidUuidException } from "@/type/exception/invalid.uuid.exception.js";
import { JwtException } from "@/type/exception/jwt.exception.js";
import { ValidationException } from "@/type/exception/validation.exception.js";
import { ErrorDetails } from "@/type/interface/error.details.js";
import { ErrorResponse } from "@/type/interface/error.response.js";
import { ValidationResponse } from "@/type/interface/validation.response.js";
import logger from "@/util/logger.js";

export const internalServerErrorMessage = "Internal Server Error";

class ExceptionHandlers {
    @ExceptionHandler(AccessDeniedException)
    handleAccessDeniedException(
        exception: AccessDeniedException,
    ): ErrorDetails {
        const status: number = exception.status;
        const message: string = exception.message;

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("AccessDeniedException", {
            message,
            stack: exception.stack,
            status,
        });

        return { message, response, status };
    }
    @ExceptionHandler(AuthenticationException)
    handleAuthenticationException(
        exception: AuthenticationException,
    ): ErrorDetails {
        const status: number = exception.status;
        const message: string = exception.message;

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("AuthenticationException", {
            message,
            stack: exception.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(BadCredentialsException)
    handleBadCredentialsException(
        exception: BadCredentialsException,
    ): ErrorDetails {
        const status = exception.status;
        const message = exception.message;

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("BadCredentialsException", {
            message,
            stack: exception.stack,
            status,
        });

        return { message, response, status };
    }
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
            stack: exception.stack,
            status,
        });

        return { message, response, status };
    }
    @ExceptionHandler(EntityMetadataNotFoundError)
    handleEntityMetadataNotFoundError(
        error: EntityMetadataNotFoundError,
    ): ErrorDetails {
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const message: string = internalServerErrorMessage;
        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("EntityMetadataNotFoundError", {
            message: error.message,
            stack: error.stack,
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
            stack: exception.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(ExpiredJwtException)
    handleExpiredJwtException(exception: ExpiredJwtException): ErrorDetails {
        const status: number = exception.status;
        const message: string = exception.message;

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("ExpiredJwtException", {
            message,
            stack: exception.stack,
            status,
        });

        return { message, response, status };
    }

    handleGenericError(error: Error): ErrorDetails {
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const message = internalServerErrorMessage;

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.error("Unhandled error", {
            message: error.message,
            originalError: error.name,
            stack: error.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(HttpException)
    handleHttpException(exception: HttpException): ErrorDetails {
        const status = exception.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception.message || internalServerErrorMessage;

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

    @ExceptionHandler(IllegalArgumentException)
    handleIllegalArgumentException(exception: IllegalArgumentException) {
        const status = exception.status;
        const message = exception.message;

        const response: ErrorResponse = {
            message,
            status,
        };
        logger.warn("IllegalArgumentException", {
            message,
            stack: exception.stack,
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
            stack: exception.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(jwt.JsonWebTokenError)
    handleJsonWebTokenError(error: jwt.JsonWebTokenError): ErrorDetails {
        const status = HttpStatus.UNAUTHORIZED;
        const message = "Invalid token";

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("JsonWebTokenError", {
            message: error.message,
            originalError: error.name,
            stack: error.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(JwtException)
    handleJwtException(exception: JwtException): ErrorDetails {
        const status: number = exception.status;
        const message: string = exception.message;

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("JwtException", {
            message,
            stack: exception.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(jwt.NotBeforeError) // Corrected reference
    handleNotBeforeError(error: jwt.NotBeforeError): ErrorDetails {
        const status = HttpStatus.UNAUTHORIZED;
        const message = "Token not active yet";

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("NotBeforeError", {
            date: error.date,
            message: error.message,
            originalError: error.name,
            stack: error.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(SyntaxError)
    handleSyntaxError(error: SyntaxError): ErrorDetails {
        const status = HttpStatus.BAD_REQUEST;
        const message = "Invalid request format or malformed data";

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("SyntaxError", {
            message: error.message,
            originalError: error.name,
            stack: error.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(jwt.TokenExpiredError)
    handleTokenExpiredError(error: jwt.TokenExpiredError): ErrorDetails {
        const status = HttpStatus.UNAUTHORIZED;
        const message = "Token has expired";

        const response: ErrorResponse = {
            message,
            status,
        };

        logger.warn("TokenExpiredError", {
            expiredAt: error.expiredAt,
            message: error.message,
            originalError: error.name,
            stack: error.stack,
            status,
        });

        return { message, response, status };
    }

    @ExceptionHandler(ValidateError)
    handleValidateError(error: ValidateError): ErrorDetails {
        const status = HttpStatus.UNPROCESSABLE_ENTITY; // Bad Request for validation errors
        const message = "Validation failed";

        // Extract validation errors from TSOA ValidateError
        const validationErrors: Record<string, string> = {};

        // TSOA ValidateError has a 'fields' property containing validation details
        if (typeof error.fields === "object") {
            Object.keys(error.fields).forEach((field) => {
                const fieldError = error.fields[field];
                if (fieldError.message) {
                    validationErrors[field] = fieldError.message;
                } else if (typeof fieldError === "string") {
                    validationErrors[field] = fieldError;
                } else {
                    validationErrors[field] = `Invalid value for ${field}`;
                }
            });
        }

        const response: ValidationResponse = {
            message,
            status,
            validationErrors,
        };

        logger.warn("ValidateError", {
            message,
            originalError: error.name,
            stack: error.stack,
            status,
            validationErrors,
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

    @ExceptionHandler(ZodError)
    handleZodError(error: ZodError): ErrorDetails {
        const status = HttpStatus.BAD_REQUEST;
        const message = "Validation failed";

        // Custom flattener that preserves full field paths
        const customFlatten = (zodError: ZodError) => {
            const fieldErrors: Record<string, string[]> = {};
            const formErrors: string[] = [];

            zodError.issues.forEach((issue: ZodIssue) => {
                const path = issue.path.join(".");
                const errorMessage = issue.message;

                if (path) {
                    // Add context for better error messages with proper typing
                    let contextualMessage = errorMessage;

                    if (issue.code === "invalid_type") {
                        const typedIssue = issue as ZodInvalidTypeIssue;
                        contextualMessage = `Expected ${typedIssue.expected}, but received ${typedIssue.received}`;
                    } else if (issue.code === "invalid_enum_value") {
                        const enumIssue = issue as ZodInvalidEnumValueIssue;
                        contextualMessage = `Must be one of: ${enumIssue.options.join(", ")}`;
                    }

                    // Use nullish coalescing to handle undefined
                    fieldErrors[path] = fieldErrors[path] ?? [];
                    fieldErrors[path].push(contextualMessage);
                } else {
                    formErrors.push(errorMessage);
                }
            });

            return { fieldErrors, formErrors };
        };

        const flattened = customFlatten(error);

        const response = {
            message,
            status,
            validationErrors: flattened,
        };

        logger.warn("ZodError", {
            flattenedErrors: flattened,
            message,
            originalError: error.name,
            stack: error.stack,
            status,
            zodErrorCount: error.issues.length,
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
