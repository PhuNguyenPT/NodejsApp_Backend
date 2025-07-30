import { HttpStatus } from "@/type/enum/http.status.js";
import { HttpException } from "@/type/exception/http.exception.js";

export class AccessDeniedException extends HttpException {
    constructor(message = "Access denied") {
        super(HttpStatus.FORBIDDEN, message, "AccessDeniedException");
    }
}
