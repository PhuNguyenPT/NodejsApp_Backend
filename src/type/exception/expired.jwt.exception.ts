import { JwtException } from "@/type/exception/jwt.exception.js";

export class ExpiredJwtException extends JwtException {
    constructor(message = "JWT token has expired") {
        super(message, "ExpiredJwtException");
    }
}
