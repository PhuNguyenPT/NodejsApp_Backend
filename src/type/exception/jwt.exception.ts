import { HttpStatus } from "@/type/enum/http-status.enum.js";
import { HttpException } from "@/type/exception/http.exception.js";

export class JwtException extends HttpException {
    constructor(message = "Invalid or expired token", name = "JwtException") {
        super(HttpStatus.UNAUTHORIZED, message, name);
    }
}
