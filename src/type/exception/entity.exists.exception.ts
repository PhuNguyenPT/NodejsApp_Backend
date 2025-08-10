import { HttpStatus } from "@/type/enum/http.status.js";
import { HttpException } from "@/type/exception/http.exception.js";

export class EntityExistsException extends HttpException {
    constructor(message = "Entity already exists") {
        super(HttpStatus.CONFLICT, message, "EntityExistsException");
    }
}
