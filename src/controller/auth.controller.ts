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

import {
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
} from "@/dto/auth/auth-request.js";
import { AuthResponse } from "@/dto/auth/auth-response.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { AuthService } from "@/service/impl/auth.service.js";
import { TYPES } from "@/type/container/types.js";
import { JwtException } from "@/type/exception/jwt.exception.js";
import { AuthenticatedRequest } from "@/type/express/express.js";

@injectable()
@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {
    constructor(
        @inject(TYPES.AuthService) private authService: AuthService,
        @inject(TYPES.Logger) private logger: Logger,
    ) {
        super();
    }

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

    @Post("logout")
    @Produces("application/json")
    @Security("bearerAuth")
    @SuccessResponse("200", "Logout successful")
    public async logout(
        @Request() request: AuthenticatedRequest,
        @Body() body?: { refreshToken?: string },
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
            body?.refreshToken,
        );

        this.setStatus(200);
        return result;
    }

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
