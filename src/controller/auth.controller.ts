import { instanceToInstance } from "class-transformer";
// src/controller/auth.controller.ts
import express from "express";
import { inject, injectable } from "inversify";
import { ExtractJwt } from "passport-jwt";
import {
    Body,
    Controller,
    Post,
    Request,
    Response,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";

import { LoginRequest, RegisterRequest } from "@/dto/auth/auth.request.js";
import { AuthResponse } from "@/dto/auth/auth.response.js";
import { AuthService } from "@/service/auth.service.js";
import { CustomJwtPayload } from "@/service/jwt.service.js";
import { TYPES } from "@/type/container/types";
import { UserStatus } from "@/type/enum/user.status";
import { ILogger } from "@/type/interface/logger";

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

    @Post("login")
    @Response("400", "Validation error")
    @Response("401", "Invalid credentials")
    @SuccessResponse("200", "Login successful")
    public async login(@Body() loginData: LoginRequest): Promise<AuthResponse> {
        return await this.authService.login(loginData);
    }

    @Post("logout")
    @Security("bearerAuth")
    @SuccessResponse("200", "Logout successful")
    public logout(@Request() request: express.Request): {
        message: string;
        success: boolean;
    } {
        // Now request.user is properly typed as JWTPayload
        const user = request.user as CustomJwtPayload;

        if (!user.id || !user.email || user.status !== UserStatus.HAPPY) {
            this.setStatus(401);
            throw new Error("User not authenticated");
        }

        this.logger.info(`User logging out: ${user.email} (ID: ${user.id})`);

        return {
            message: "Logout successful. Client should now discard the token.",
            success: true,
        };
    }

    @Post("refresh")
    @Response("401", "Invalid refresh token")
    @Security("bearerAuth") // Add this security decorator
    @SuccessResponse("200", "Token refresh successful")
    public async refreshToken(
        @Request() request: express.Request,
    ): Promise<{ refreshToken: string }> {
        const user = request.user as CustomJwtPayload;
        const currentToken: null | string =
            ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        const expressUser: Express.User = instanceToInstance(user);
        if (!currentToken) {
            this.setStatus(401);
            throw new Error("No valid bearer token provided");
        }
        // Pass user info to refresh token service if needed
        const token: string = await this.authService.refreshToken(
            currentToken,
            expressUser,
        );

        return {
            refreshToken: token,
        };
    }

    @Post("register")
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
