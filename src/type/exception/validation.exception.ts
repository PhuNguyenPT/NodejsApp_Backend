// src/type/exception/validation.exception.ts
import { HttpException } from "@/type/exception/http.exception.js";

export class ValidationException extends HttpException {
    public validationErrors: Record<string, string>;

    constructor(validationErrors: Record<string, string>) {
        super(400, "Validation failed", "ValidationException");
        this.validationErrors = validationErrors;
    }
}
