import { HttpStatus } from "@/type/enum/http-status.js";
import { HttpException } from "@/type/exception/http.exception.js";

/**
 * Exception thrown when validation fails for user input or payload.
 */
export class ValidationException extends HttpException {
    public validationErrors: Record<string, string>;

    /**
     * Creates a new ValidationException with detailed validation errors.
     * @param validationErrors - An object mapping field names to error messages.
     * @param message - Custom error message (defaults to "Validation failed")
     */
    constructor(
        validationErrors: Record<string, string>,
        message = "Validation failed",
    ) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, message, "ValidationException");
        this.validationErrors = validationErrors;
    }
}
