import { IsEmail, IsString, Length, Matches } from "class-validator";

/**
 * DTO for user login request.
 *
 * @example
 * {
 *   "email": "user@example.com",
 *   "password": "StrongPassw0rd!"
 * }
 */
export class LoginRequest {
    @IsEmail({}, { message: "Must be a valid email address" })
    email!: string;

    @IsString({ message: "Password must be a string" })
    @Length(8, 128, {
        message: "Password must be between 8 and 128 characters",
    })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message:
                "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)",
        },
    )
    password!: string;
}

/**
 * DTO for refresh token request.
 *
 * @example
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
export class RefreshTokenRequest {
    @IsString({ message: "Refresh token must be a string" })
    refreshToken!: string;
}

/**
 * DTO for user registration request.
 *
 * @example
 * {
 *   "email": "newuser@example.com",
 *   "password": "SecureP@ss123"
 * }
 */
export class RegisterRequest {
    @IsEmail({}, { message: "Must be a valid email address" })
    email!: string;

    @IsString({ message: "Password must be a string" })
    @Length(8, 128, {
        message: "Password must be between 8 and 128 characters",
    })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        {
            message:
                "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)",
        },
    )
    password!: string;
}
