import type { Exception } from "tsoa";

/**
 * Base class for all HTTP-related exceptions.
 * Extends the native Error object and adds an HTTP status code.
 */
export class HttpException extends Error implements Exception {
    public status: number;

    /**
     * Creates a new HttpException.
     * @param status - HTTP status code (e.g., 400, 404, 500).
     * @param message - Description of the error.
     * @param name - Optional name of the exception class.
     */
    constructor(status: number, message: string, name?: string) {
        super(message);
        this.status = status;
        this.name = name ?? "HttpException";
        Error.captureStackTrace(this, new.target);
    }
}
