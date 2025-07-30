import { HttpStatus } from "@/type/enum/http.status";
import { HttpException } from "@/type/exception/http.exception";

/**
 * Exception thrown when an invalid argument is passed to a function or method.
 */
export class IllegalArgumentException extends HttpException {
    /**
     * Creates a new IllegalArgumentException.
     * @param message - Optional custom message (default is "Invalid argument").
     */
    constructor(message = "Invalid argument") {
        super(HttpStatus.BAD_REQUEST, message, "IllegalArgumentException");
    }
}
