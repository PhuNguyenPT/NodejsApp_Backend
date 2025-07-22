import { HttpException } from "./http.exception";

/**
 * Exception thrown when an invalid argument is passed to a function or method.
 */
export class InvalidArgumentException extends HttpException {
    /**
     * Creates a new InvalidArgumentException.
     * @param message - Optional custom message (default is "Invalid argument").
     */
    constructor(message = "Invalid argument") {
        super(409, message, "InvalidArgumentException");
    }
}
