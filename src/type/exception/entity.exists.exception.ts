import { HttpStatus } from "@/type/enum/http.status";
import { HttpException } from "@/type/exception/http.exception";

export class EntityExistsException extends HttpException {
    constructor(message = "Entity already exists") {
        super(HttpStatus.CONFLICT, message, "EntityExistsException");
    }
}
