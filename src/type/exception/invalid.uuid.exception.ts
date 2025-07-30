// src/type/exception/invalid.uuid.exception.ts
import { HttpStatus } from "@/type/enum/http.status";
import { HttpException } from "@/type/exception/http.exception";

/**
 * Exception thrown when an invalid UUID format is provided
 * Extends HttpException for consistent error handling
 */
export class InvalidUuidException extends HttpException {
    constructor() {
        super(
            HttpStatus.BAD_REQUEST,
            "Invalid UUID format",
            "InvalidUuidException",
        );
    }
}
