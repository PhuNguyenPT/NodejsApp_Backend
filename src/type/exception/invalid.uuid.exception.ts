// src/type/exception/invalid.uuid.exception.ts
import { HttpException } from "@/type/exception/http.exception";

/**
 * Exception thrown when an invalid UUID format is provided
 * Extends HttpException for consistent error handling
 */
export class InvalidUuidException extends HttpException {
    constructor() {
        super(400, "Invalid UUID format", "InvalidUuidException");
    }
}
