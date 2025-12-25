import { inject, injectable } from "inversify";
import { ExtractJwt } from "passport-jwt";
import {
    Body,
    Controller,
    Middlewares,
    Post,
    Produces,
    Request,
    Response,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";
import { Logger } from "winston";

import type { IAuthService } from "@/service/auth-service.interface.js";

import {
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
} from "@/dto/auth/auth-request.js";
import { AuthResponse } from "@/dto/auth/auth-response.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";
import { JwtException } from "@/type/exception/jwt.exception.js";

/**
 * Controller responsible for handling authentication-related HTTP requests.
 * Provides endpoints for user authentication, registration, token management, and session handling.
 *
 * This controller implements JWT-based authentication with refresh token rotation,
 * token family tracking, and comprehensive security measures including:
 * - Token blacklisting for logout
 * - Token reuse detection with automatic family invalidation
 * - Secure token rotation on refresh
 * - Account status validation on each request
 */
@injectable()
@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {
    /**
     * Creates an instance of AuthController.
     *
     * @param authService - Service for handling authentication business logic
     * @param logger - Winston logger for request/response logging
     */
    constructor(
        @inject(TYPES.IAuthService) private authService: IAuthService,
        @inject(TYPES.Logger) private logger: Logger,
    ) {
        super();
    }

    /**
     * Authenticate a user with email and password credentials.
     *
     * Upon successful authentication:
     * - Verifies email and password using bcrypt comparison
     * - Generates a new token family ID for this authentication session
     * - Creates access and refresh tokens with matching family IDs
     * - Stores both tokens in Redis with appropriate TTLs
     * - Returns tokens along with user information
     *
     * The access token is used for subsequent API requests, while the refresh token
     * is used to obtain new access tokens when they expire. Both tokens share the
     * same family ID to enable family-based invalidation for security.
     *
     * @summary Authenticate user with credentials
     * @param loginData User credentials containing email and password
     * @returns {AuthResponse} Authentication response with tokens and user data
     * @throws {ValidationException} When request body validation fails (invalid email format, missing fields)
     * @throws {BadCredentialsException} When email or password is incorrect, or user doesn't exist
     * @throws {HttpException} When internal error occurs during authentication
     */
    @Middlewares(validateDTO(LoginRequest))
    @Post("login")
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Invalid credentials")
    @SuccessResponse(HttpStatus.OK, "Login successful")
    public async login(@Body() loginData: LoginRequest): Promise<AuthResponse> {
        const authResponse: AuthResponse =
            await this.authService.login(loginData);
        this.setStatus(HttpStatus.OK);
        return authResponse;
    }

    /**
     * Log out an authenticated user by blacklisting their tokens.
     *
     * This endpoint invalidates the current session through the following process:
     * 1. Extracts access token from Authorization header (required)
     * 2. Validates the access token exists in Redis and retrieves its family ID
     * 3. If refresh token provided, validates it belongs to the same token family
     * 4. Blacklists both tokens by:
     *    - Marking them as blacklisted in Redis
     *    - Setting short TTL (60 seconds) for blacklist entry persistence
     *    - Removing token IDs from the family set
     * 5. Prevents further use of these tokens
     *
     * Security features:
     * - Requires matching family IDs between access and refresh tokens
     * - Logs warning if family IDs don't match (ignores refresh token)
     * - Gracefully handles already blacklisted or expired tokens
     * - Uses atomic Redis pipeline operations for consistency
     *
     * @summary Log out authenticated user
     * @param request Express request object with authenticated user context
     * @param logoutRequest Request containing the refresh token to blacklist (optional but recommended)
     * @returns {object} Logout confirmation response with success status
     * @throws {JwtException} When access token is missing from Authorization header
     * @throws {ValidationException} When request body validation fails
     * @throws {HttpException} When internal error occurs during logout
     */
    @Middlewares(validateDTO(LogoutRequest))
    @Post("logout")
    @Produces("application/json")
    @Response<string>(HttpStatus.BAD_REQUEST, "No access token provided")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth")
    @SuccessResponse(HttpStatus.OK, "Logout successful")
    public async logout(
        @Request() request: Express.AuthenticatedRequest,
        @Body() logoutRequest?: LogoutRequest,
    ): Promise<{
        message: string;
        success: boolean;
    }> {
        const user = request.user;

        // Extract access token from Authorization header
        const accessToken: null | string =
            ExtractJwt.fromAuthHeaderAsBearerToken()(request);

        if (!accessToken) {
            this.setStatus(HttpStatus.BAD_REQUEST);
            throw new JwtException("No access token provided");
        }

        this.logger.info(`User logging out: ${user.email} (ID: ${user.id})`);

        // Call auth service to handle token blacklisting
        const result = await this.authService.logout(
            accessToken,
            logoutRequest?.refreshToken,
        );

        this.setStatus(HttpStatus.OK);
        return result;
    }

    /**
     * Refresh an expired or expiring access token using a valid refresh token.
     *
     * This endpoint implements secure token rotation with the following process:
     * 1. Validates refresh token exists in Redis and checks its validity
     * 2. Detects token reuse (security feature):
     *    - If token is blacklisted: SECURITY ALERT - invalidates entire token family
     *    - If token is expired: logs warning and invalidates family
     * 3. Verifies JWT signature and claims
     * 4. Validates user still exists and account is active
     * 5. Blacklists the old refresh token immediately to prevent reuse
     * 6. Generates new access and refresh tokens with the SAME family ID
     * 7. Stores new tokens in Redis with appropriate TTLs
     * 8. Returns fresh tokens with updated user data from database
     *
     * Token Family Security:
     * - All tokens in a login session share the same family ID
     * - If a blacklisted or expired token is reused (indicating possible token theft),
     *   the entire token family is invalidated as a security measure
     * - This prevents attackers from using any stolen tokens from that session
     *
     * Database Validation:
     * - Fetches fresh user data from database on each refresh
     * - Validates account is still active
     * - Ensures user still exists
     * - New tokens contain up-to-date user information
     *
     * @summary Refresh access token
     * @param refreshData Request containing the refresh token
     * @returns {AuthResponse} New authentication response with fresh access and refresh tokens
     * @throws {JwtException} When refresh token is missing, invalid, expired, blacklisted, or reused
     * @throws {AuthenticationException} When the user no longer exists
     * @throws {AccessDeniedException} When the user account is inactive
     * @throws {ValidationException} When request body validation fails
     * @throws {HttpException} When JWT verification fails or internal error occurs
     */
    @Middlewares(validateDTO(RefreshTokenRequest))
    @Post("refresh")
    @Produces("application/json")
    @Response<string>(HttpStatus.BAD_REQUEST, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Invalid refresh token")
    @SuccessResponse(HttpStatus.OK, "Token refresh successful")
    public async refreshToken(
        @Body() refreshData: RefreshTokenRequest,
    ): Promise<AuthResponse> {
        const { refreshToken } = refreshData;

        if (!refreshToken) {
            this.setStatus(HttpStatus.BAD_REQUEST);
            throw new JwtException("Refresh token is required");
        }

        // Pass refresh token from request body to service
        const authResponse: AuthResponse =
            await this.authService.refreshToken(refreshToken);
        this.setStatus(HttpStatus.OK);
        return authResponse;
    }

    /**
     * Register a new user account with email and password.
     *
     * This endpoint creates a new user account through the following process:
     * 1. Validates email format and password strength
     * 2. Uses database transaction with pessimistic write lock to prevent race conditions
     * 3. Checks if user already exists (throws error if duplicate email)
     * 4. Hashes password using bcrypt with 12 salt rounds
     * 5. Creates user with default USER role and permissions
     * 6. Saves user to database within transaction
     * 7. Generates new token family ID
     * 8. Creates access and refresh tokens with matching family IDs
     * 9. Stores tokens in Redis with appropriate TTLs
     * 10. Automatically logs in user and returns tokens
     *
     * Security features:
     * - Pessimistic write lock prevents concurrent registration with same email
     * - Password never stored in plain text
     * - Uses bcrypt with 12 salt rounds for strong password hashing
     * - Automatic login after registration for seamless user experience
     *
     * Default user settings:
     * - Role: USER
     * - Permissions: Default USER role permissions
     * - Account active by default
     *
     * @summary Register new user account
     * @param registerData Registration data containing email and password
     * @returns {AuthResponse} Authentication response with tokens and new user data
     * @throws {ValidationException} When request body validation fails (invalid email format, weak password)
     * @throws {EntityExistsException} When a user with the email already exists
     * @throws {HttpException} When internal error occurs during registration or token generation
     */
    @Middlewares(validateDTO(RegisterRequest))
    @Post("register")
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.CONFLICT, "User already exists")
    @SuccessResponse(HttpStatus.CREATED, "Registration successful")
    public async register(
        @Body() registerData: RegisterRequest,
    ): Promise<AuthResponse> {
        const result = await this.authService.register(registerData);
        this.setStatus(HttpStatus.CREATED);
        return result;
    }
}
