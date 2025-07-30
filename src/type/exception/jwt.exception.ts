import { HttpStatus } from "@/type/enum/http.status";
import { HttpException } from "@/type/exception/http.exception";

export class JwtException extends HttpException {
    constructor(message = "Invalid or expired token", name = "JwtException") {
        super(HttpStatus.UNAUTHORIZED, message, name);
    }
}
