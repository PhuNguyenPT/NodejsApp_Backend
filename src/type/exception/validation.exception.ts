// src/type/exception/validation.exception.ts
import HttpException from "@/type/exception/http.exception.js";

class ValidationException extends HttpException {
  public validationErrors: Record<string, string>;

  constructor(
    validationErrors: Record<string, string>,
    message = "Validation failed",
  ) {
    super(400, message);
    this.validationErrors = validationErrors;
  }
}

export default ValidationException;
