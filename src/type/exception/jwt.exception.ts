import { HttpException } from "./http.exception";

export class JwtException extends HttpException {
    constructor(message = "Invalid or expired token", name = "JwtException") {
        super(401, message, name);
    }
}
