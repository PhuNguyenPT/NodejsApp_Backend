import { HttpStatus } from "@/type/enum/http-status.enum.js";
import { HttpException } from "@/type/exception/http.exception.js";

export class AuthenticationException extends HttpException {
    constructor(message = "Unauthorized") {
        super(HttpStatus.UNAUTHORIZED, message, "AuthenticationException");
    }
}
