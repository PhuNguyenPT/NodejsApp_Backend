import { HttpStatus } from "@/type/enum/http.status";
import { HttpException } from "@/type/exception/http.exception";

export class BadCredentialsException extends HttpException {
    constructor(message = "Invalid username or password") {
        super(HttpStatus.UNAUTHORIZED, message, "BadCredentialsException");
    }
}
