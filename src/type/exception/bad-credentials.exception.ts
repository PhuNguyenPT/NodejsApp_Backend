import { HttpStatus } from "@/type/enum/http-status.enum.js";
import { HttpException } from "@/type/exception/http.exception.js";

export class BadCredentialsException extends HttpException {
    constructor(message = "Invalid username or password") {
        super(HttpStatus.UNAUTHORIZED, message, "BadCredentialsException");
    }
}
