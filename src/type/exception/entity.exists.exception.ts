import { HttpException } from "./http.exception";

export class EntityExistsException extends HttpException {
    constructor(message = "Entity already exists") {
        super(409, message, "EntityExistsException");
    }
}
