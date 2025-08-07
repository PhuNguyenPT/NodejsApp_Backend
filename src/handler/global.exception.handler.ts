import {
    JsonWebTokenError,
    NotBeforeError,
    TokenExpiredError,
} from "jsonwebtoken";
import { ValidateError } from "tsoa";
import { EntityMetadataNotFoundError } from "typeorm";

// src/handler/global.exception.handler.ts
import { ExceptionHandler } from "@/decorator/exception.handler.decorator.js";
import { HttpStatus } from "@/type/enum/http.status";
import { AccessDeniedException } from "@/type/exception/access.denied.exception";
import { AuthenticationException } from "@/type/exception/authentication.exception";
import { BadCredentialsException } from "@/type/exception/bad.credentials.exception";
import { EntityExistsException } from "@/type/exception/entity.exists.exception";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception";
import { ExpiredJwtException } from "@/type/exception/expired.jwt.exception";
import { HttpException } from "@/type/exception/http.exception";
import { IllegalArgumentException } from "@/type/exception/illegal.argument.exception";
import { InvalidUuidException } from "@/type/exception/invalid.uuid.exception";
import { JwtException } from "@/type/exception/jwt.exception";
import { ValidationException } from "@/type/exception/validation.exception";
import { ErrorDetails } from "@/type/interface/error.details";
import { ErrorResponse } from "@/type/interface/error.response";
import { ValidationResponse } from "@/type/interface/validation.response";
import logger from "@/util/logger";

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
        const status =
            Number(exception.status) || HttpStatus.INTERNAL_SERVER_ERROR;
        const message = String(exception.message) || internalServerErrorMessage;

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

    @ExceptionHandler(JsonWebTokenError)
    handleJsonWebTokenError(error: JsonWebTokenError): ErrorDetails {
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

    @ExceptionHandler(NotBeforeError)
    handleNotBeforeError(error: NotBeforeError): ErrorDetails {
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

    @ExceptionHandler(TokenExpiredError)
    handleTokenExpiredError(error: TokenExpiredError): ErrorDetails {
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
}

// Create an instance to avoid "only static properties" ESLint error
const exceptionHandlers = new ExceptionHandlers();

// Export the generic error handler with proper typing
export const handleGenericError = (error: Error): ErrorDetails => {
    return exceptionHandlers.handleGenericError(error);
};

// Also export the class instance if needed elsewhere
export const GlobalExceptionHandler = exceptionHandlers;
