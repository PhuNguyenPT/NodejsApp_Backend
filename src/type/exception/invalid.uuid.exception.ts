import { HttpException } from "@/type/exception/http.exception";

/**
 * Exception thrown when an invalid UUID format is provided.
 */
export class InvalidUuidException extends HttpException {
    /**
     * Creates a new InvalidUuidException with a default message.
     */
    constructor() {
        super(400, "Invalid UUID format", "InvalidUuidException");
    }
}
