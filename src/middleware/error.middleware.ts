import { NextFunction, Request, Response } from "express";

import { HttpException } from "@/type/exception/http.exception.js";
import { InvalidUuidException } from "@/type/exception/invalid.uuid.exception";
import { EntityNotFoundException } from "@/type/exception/user.not.found.exception";
import { ValidationException } from "@/type/exception/validation.exception.js";
import logger from "@/util/logger.js";

interface ErrorDetails {
  message: string;
  response: ErrorResponse;
  status: number;
}

interface ErrorResponse {
  message: string;
  status: number;
}

interface ValidationResponse extends ErrorResponse {
  validationErrors?: Record<string, string>;
}

function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { response, status } = getErrorDetails(error);

  // Check if response has already been sent
  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(status).json(response);
}

function getErrorDetails(error: Error): ErrorDetails {
  if (error instanceof ValidationException) {
    return handleValidationException(error);
  }

  if (error instanceof EntityNotFoundException) {
    return handleEntityNotFoundException(error);
  }

  if (error instanceof InvalidUuidException) {
    return handleInvalidUuidException(error);
  }

  if (error instanceof HttpException) {
    return handleHttpException(error);
  }

  return handleGenericError(error);
}

function handleEntityNotFoundException(
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

function handleGenericError(error: Error): ErrorDetails {
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

function handleHttpException(error: HttpException): ErrorDetails {
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

function handleInvalidUuidException(error: InvalidUuidException): ErrorDetails {
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

function handleValidationException(error: ValidationException): ErrorDetails {
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

export default errorMiddleware;
