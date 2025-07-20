// src/middleware/error.middleware.ts
import { NextFunction, Request, Response } from "express";

import { ExceptionHandlerRegistry } from "@/decorator/exception.handler.decorator.js";
import { handleGenericError } from "@/handler/global.exception.handler.js";
import { ErrorDetails } from "@/type/interface/error.details.js";

function ensureError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  // Convert non-Error values to Error instances
  if (typeof error === "string") {
    return new Error(error);
  }

  if (typeof error === "object" && error !== null) {
    return new Error(JSON.stringify(error));
  }

  return new Error("Unknown error occurred");
}

function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Ensure error is an Error instance
  const actualError = ensureError(error);
  const errorDetails = getErrorDetails(actualError);

  // Check if response has already been sent
  if (res.headersSent) {
    next(actualError);
    return;
  }

  // Ensure status is a valid HTTP status code
  const status = validateHttpStatus(errorDetails.status);

  res.status(status).json(errorDetails.response);
}

function getErrorDetails(error: Error): ErrorDetails {
  // Try to find a registered handler
  const handler = ExceptionHandlerRegistry.getHandler(error);

  if (handler) {
    return handler(error);
  }

  // Fallback to generic error handler
  return handleGenericError(error);
}

function validateHttpStatus(status: unknown): number {
  // Ensure status is a valid HTTP status code
  const numericStatus = Number(status);

  if (isNaN(numericStatus) || numericStatus < 100 || numericStatus > 599) {
    return 500; // Default to Internal Server Error
  }

  return numericStatus;
}

export default errorMiddleware;
