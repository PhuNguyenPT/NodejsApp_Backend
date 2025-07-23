import { HttpException } from "./http.exception";

export class BadCredentialsException extends HttpException {
    constructor(message = "Invalid username or password") {
        super(401, message, "BadCredentialsException");
    }
}
