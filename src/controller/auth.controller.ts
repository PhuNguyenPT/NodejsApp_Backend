// src/controller/auth.controller.ts
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
import type { AuthenticatedRequest } from "@/type/express/express.js";

import {
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
} from "@/dto/auth/auth-request.js";
import { AuthResponse } from "@/dto/auth/auth-response.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { TYPES } from "@/type/container/types.js";
import { JwtException } from "@/type/exception/jwt.exception.js";

/**
 * Controller responsible for handling authentication-related HTTP requests.
 * Provides endpoints for user authentication, registration, token management, and session handling.
 *
 * This controller implements JWT-based authentication with refresh token rotation
 * and comprehensive security measures including token blacklisting and family invalidation.
 *
 * @class AuthController
 * @extends {Controller}
 */
@injectable()
@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {
    /**
     * Creates an instance of AuthController.
     *
     * @param {AuthService} authService - Service for handling authentication business logic
     * @param {Logger} logger - Winston logger for request/response logging
     * @memberof AuthController
     */
    constructor(
        @inject(TYPES.IAuthService) private authService: IAuthService,
        @inject(TYPES.Logger) private logger: Logger,
    ) {
        super();
    }

    /**
     * Authenticates a user with email and password credentials.
     * Upon successful authentication, returns access and refresh tokens along with user information.
     *
     * @summary Authenticates a user with email and password credentials
     * @param {LoginRequest} loginData - User credentials containing email and password
     * @returns {Promise<AuthResponse>} Authentication response with tokens and user data
     *
     * @throws {ValidationException} When request body validation fails
     * @throws {BadCredentialsException} When email or password is incorrect
     * @throws {HttpException} When account is inactive or internal error occurs
     *
     * @example
     * POST /auth/login
     * Content-Type: application/json
     * {
     *   "email": "jane.doe@example.com",
     *   "password": "SecurePass123!"
     * }
     *
     * @memberof AuthController
     */
    @Middlewares(validateDTO(LoginRequest))
    @Post("login")
    @Produces("application/json")
    @Response("400", "Validation error")
    @Response("401", "Invalid credentials")
    @SuccessResponse("200", "Login successful")
    public async login(@Body() loginData: LoginRequest): Promise<AuthResponse> {
        const authResponse: AuthResponse =
            await this.authService.login(loginData);
        this.setStatus(200);
        return authResponse;
    }

    /**
     * Logs out an authenticated user by blacklisting their access and/or refresh tokens.
     * This endpoint invalidates the current session and prevents further use of the provided tokens.
     *
     * The client should send the refresh token in the request body for complete logout.
     * The access token is automatically extracted from the Authorization header.
     *
     * @summary Logs out an authenticated user by blacklisting their access and/or refresh tokens.
     * @param {AuthenticatedRequest} request - Express request object with authenticated user context
     * @param {RefreshTokenRequest} logoutRequest - Request containing the refresh token
     * @returns {Promise<{message: string; success: boolean}>} Logout confirmation response
     *
     * @throws {ValidationException} When request body validation fails
     * @throws {JwtException} When refresh token is missing, invalid, expired, or reused
     * @throws {AuthenticationException} When the user no longer exists
     * @throws {AccessDeniedException} When the user account is inactive
     * @throws {HttpException} When JWT verification fails or internal error occurs
     *
     * @example
     * POST /auth/logout
     * Authorization: Bearer <access_token>
     * Content-Type: application/json
     * {
     *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     * }
     *
     * @memberof AuthController
     */
    @Middlewares(validateDTO(LogoutRequest))
    @Post("logout")
    @Produces("application/json")
    @Response("400", "No access token provided")
    @Security("bearerAuth")
    @SuccessResponse("200", "Logout successful")
    public async logout(
        @Request() request: AuthenticatedRequest,
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
            this.setStatus(400);
            throw new JwtException("No access token provided");
        }

        // Extract refresh token from request body (client should send it)
        this.logger.info(`User logging out: ${user.email} (ID: ${user.id})`);

        // Call auth service to handle token blacklisting
        const result = await this.authService.logout(
            accessToken,
            logoutRequest?.refreshToken,
        );

        this.setStatus(200);
        return result;
    }

    /**
     * Refreshes an expired or expiring access token using a valid refresh token.
     * This endpoint implements secure token rotation - the old refresh token is invalidated
     * and new access and refresh tokens are issued with the same token family ID.
     *
     * Token reuse detection: If a blacklisted or expired refresh token is used,
     * the entire token family is invalidated as a security measure.
     *
     * @summary  Refreshes an expired or expiring access token using a valid refresh token
     * @param {RefreshTokenRequest} refreshData - Request containing the refresh token
     * @returns {Promise<AuthResponse>} New authentication response with fresh tokens
     *
     * @throws {ValidationException} When request body validation fails
     * @throws {JwtException} When refresh token is missing, invalid, expired, or reused
     * @throws {AuthenticationException} When the user no longer exists
     * @throws {AccessDeniedException} When the user account is inactive
     * @throws {HttpException} When JWT verification fails or internal error occurs
     *
     * @example
     * POST /auth/refresh
     * Content-Type: application/json
     * {
     *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     * }
     *
     * @memberof AuthController
     */
    @Middlewares(validateDTO(RefreshTokenRequest))
    @Post("refresh")
    @Produces("application/json")
    @Response("400", "Validation error")
    @Response("401", "Invalid refresh token")
    @SuccessResponse("200", "Token refresh successful")
    public async refreshToken(
        @Body() refreshData: RefreshTokenRequest,
    ): Promise<AuthResponse> {
        const { refreshToken } = refreshData;

        if (!refreshToken) {
            this.setStatus(400);
            throw new JwtException("Refresh token is required");
        }

        // Pass refresh token from request body to service
        const authResponse: AuthResponse =
            await this.authService.refreshToken(refreshToken);
        this.setStatus(200);
        return authResponse;
    }

    /**
     * Registers a new user account with email and password.
     * Upon successful registration, the user is automatically logged in and receives
     * access and refresh tokens along with their user profile information.
     *
     * New users are created with default USER role and HAPPY status.
     * Passwords are securely hashed using bcrypt with 12 salt rounds.
     *
     * @summary  Registers a new user account with email and password
     * @param {RegisterRequest} registerData - Registration data containing email and password
     * @returns {Promise<AuthResponse>} Authentication response with tokens and new user data
     *
     * @throws {ValidationException} When request body validation fails
     * @throws {EntityExistsException} When a user with the email already exists
     * @throws {HttpException} When internal error occurs during registration
     *
     * @example
     * POST /auth/register
     * Content-Type: application/json
     * {
     *   "email": "jane.doe@example.com",
     *   "password": "SecurePass123!"
     * }
     *
     * @memberof AuthController
     */
    @Middlewares(validateDTO(RegisterRequest))
    @Post("register")
    @Produces("application/json")
    @Response("400", "Validation error")
    @Response("409", "User already exists")
    @SuccessResponse("201", "Registration successful")
    public async register(
        @Body() registerData: RegisterRequest,
    ): Promise<AuthResponse> {
        const result = await this.authService.register(registerData);
        this.setStatus(201);
        return result;
    }
}
