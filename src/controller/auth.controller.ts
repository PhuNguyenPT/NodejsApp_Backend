// src/controller/auth.controller.ts
import express from "express";
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

import { LoginRequest, RegisterRequest } from "@/dto/auth/auth.request.js";
import { AuthResponse } from "@/dto/auth/auth.response.js";
import validateDTO from "@/middleware/validation.middleware.js";
import { AuthService } from "@/service/auth.service.js";
import { TYPES } from "@/type/container/types.js";
import { JwtException } from "@/type/exception/jwt.exception.js";
import { AuthenticatedRequest } from "@/type/express/express.js";
import { ILogger } from "@/type/interface/logger.js";

@injectable()
@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {
    constructor(
        @inject(TYPES.AuthService) private authService: AuthService,
        @inject(TYPES.Logger) private logger: ILogger,
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
        @Body() body: { refreshToken: string },
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
            body.refreshToken,
        );

        this.setStatus(200);
        return result;
    }

    @Post("refresh")
    @Produces("application/json")
    @Response("401", "Invalid refresh token")
    @Security("bearerAuth") // Add this security decorator
    @SuccessResponse("200", "Token refresh successful")
    public async refreshToken(
        @Request() request: express.Request,
    ): Promise<AuthResponse> {
        if (!request.user) {
            throw new JwtException("Unknown user");
        }
        const user = request.user;
        const currentToken: null | string =
            ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        if (!currentToken) {
            this.setStatus(401);
            throw new JwtException("No valid bearer token provided");
        }
        // Pass user info to refresh token service if needed
        const authResponse: AuthResponse = await this.authService.refreshToken(
            currentToken,
            user,
        );
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
