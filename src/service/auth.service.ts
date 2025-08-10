// src/service/auth.service.ts
import bcrypt from "bcrypt";
import { plainToClass } from "class-transformer";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";

import { LoginRequest, RegisterRequest } from "@/dto/auth/auth.request.js";
import { AuthResponse } from "@/dto/auth/auth.response.js";
import { User } from "@/dto/user/user.js";
import { UserEntity } from "@/entity/user.js";
import { IUserRepository } from "@/repository/user.repository.interface.js";
import { JWTService } from "@/service/jwt.service.js";
import { TYPES } from "@/type/container/types.js";
import {
    getDefaultPermissionsByRole,
    Role,
    UserStatus,
} from "@/type/enum/user.js";
import { BadCredentialsException } from "@/type/exception/bad.credentials.exception.js";
import { EntityExistsException } from "@/type/exception/entity.exists.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";
import { HttpException } from "@/type/exception/http.exception.js";
import { CustomJwtPayload } from "@/type/interface/jwt.js";
import { ILogger } from "@/type/interface/logger.js";
import { ACCESS_TOKEN_EXPIRATION_SECONDS } from "@/util/jwt.options.js";

@injectable()
export class AuthService {
    constructor(
        @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
        @inject(TYPES.JWTService) private jwtService: JWTService,
        @inject(TYPES.Logger) private logger: ILogger,
    ) {}

    async login(loginData: LoginRequest): Promise<AuthResponse> {
        const { email, password } = loginData;

        try {
            // Find user by email - will throw EntityNotFoundException if not found
            const user: UserEntity =
                await this.userRepository.findByEmail(email);

            // Check if account is active
            if (user.status !== UserStatus.HAPPY) {
                this.logger.warn(
                    `Login attempt for inactive account: ${email}`,
                );
                throw new HttpException(403, "Account is not active");
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(
                password,
                user.password,
            );
            if (!isPasswordValid) {
                throw new BadCredentialsException("Invalid email or password");
            }

            // Create JWT payload
            const jwtPayload: CustomJwtPayload = {
                email: user.email,
                id: user.id,
                name: user.name,
                permissions: user.permissions,
                role: user.role,
                status: user.status,
            };

            // Generate tokens
            const accessToken: string =
                await this.jwtService.generateAccessToken(jwtPayload);

            const refreshToken =
                await this.jwtService.generateRefreshToken(jwtPayload);

            // Convert entity to DTO
            const userDto = plainToClass(User, user);

            this.logger.info(`Successful login for user: ${email}`);

            return new AuthResponse({
                accessToken: accessToken,
                expiresIn: ACCESS_TOKEN_EXPIRATION_SECONDS, // Updated
                message: "Login successful",
                refreshToken: refreshToken,
                success: true,
                user: userDto,
            });
        } catch (error) {
            // If it's already a domain exception, re-throw it
            if (error instanceof EntityNotFoundException) {
                // Convert to BadCredentialsException to avoid revealing user existence
                throw new BadCredentialsException("Invalid email or password");
            } else if (
                error instanceof jwt.TokenExpiredError ||
                error instanceof jwt.JsonWebTokenError ||
                error instanceof jwt.NotBeforeError ||
                error instanceof HttpException
            ) {
                throw error;
            }

            // Log unexpected errors
            this.logger.error("Unexpected error during login", {
                email,
                error: error instanceof Error ? error.message : String(error),
            });

            throw new HttpException(500, "Login failed due to internal error");
        }
    }

    async logout(
        accessToken: string,
        refreshToken?: string,
    ): Promise<{ message: string; success: boolean }> {
        try {
            const tokensToBlacklist: string[] = [];

            if (accessToken) tokensToBlacklist.push(accessToken);
            if (refreshToken) tokensToBlacklist.push(refreshToken);

            if (tokensToBlacklist.length === 0) {
                this.logger.warn("Logout called with no tokens provided");
                return {
                    message: "No tokens to logout",
                    success: true,
                };
            }

            // Blacklist all tokens in parallel
            const blacklistPromises = tokensToBlacklist.map((token) =>
                this.jwtService.logout(token),
            );

            const results = await Promise.allSettled(blacklistPromises);

            const successCount = results.filter(
                (result) => result.status === "fulfilled" && result.value,
            ).length;

            const failedCount = results.length - successCount;

            if (failedCount > 0) {
                this.logger.warn(
                    `Logout partial success: ${successCount.toString()}/${results.length.toString()} tokens blacklisted`,
                );
            } else {
                this.logger.info(
                    `Logout successful: ${successCount.toString()} token(s) blacklisted`,
                );
            }

            return {
                message: "Logout successful",
                success: true,
            };
        } catch (error) {
            this.logger.error("Logout error", {
                error: error instanceof Error ? error.message : String(error),
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
            });

            return {
                message: "Logout completed (some tokens may remain active)",
                success: true,
            };
        }
    }

    async refreshToken(
        refreshToken: string,
        userJwtPayload: Express.User,
    ): Promise<AuthResponse> {
        try {
            this.logger.debug("Verifying token", {
                token: refreshToken.substring(0, 50) + "...",
            });

            // Verify refresh token - will throw if invalid
            const payload: CustomJwtPayload =
                await this.jwtService.verifyToken(refreshToken);

            // Check if user still exists and is active
            const user = await this.userRepository.findById(payload.id);

            if (!user) {
                throw new HttpException(401, "User not found");
            }

            // Verify token belongs to current user
            const currentUser = userJwtPayload as CustomJwtPayload;
            if (
                currentUser.email !== user.email ||
                currentUser.id !== user.id
            ) {
                this.logger.warn("Token user mismatch", {
                    dbEmail: user.email,
                    dbId: user.id,
                    tokenEmail: currentUser.email,
                    tokenId: currentUser.id,
                });
                throw new HttpException(401, "Invalid refresh token");
            }

            if (user.status !== UserStatus.HAPPY) {
                throw new HttpException(403, "Account is no longer active");
            }

            // Create JWT payload with fresh user data
            const jwtPayload: CustomJwtPayload = {
                email: user.email,
                id: user.id,
                name: user.name,
                permissions: user.permissions,
                role: user.role,
                status: user.status,
            };

            // Generate new access token
            const newAccessToken =
                await this.jwtService.generateAccessToken(jwtPayload);

            // Generate new refresh token
            const newRefreshToken =
                await this.jwtService.generateRefreshToken(jwtPayload);

            // Blacklist the old refresh token to prevent reuse
            await this.jwtService.logout(refreshToken);

            this.logger.info(`Token refreshed for user: ${user.email}`);

            return new AuthResponse({
                accessToken: newAccessToken, // New access token
                expiresIn: ACCESS_TOKEN_EXPIRATION_SECONDS,
                message: "Token refresh successful",
                refreshToken: newRefreshToken, // New refresh token
                success: true,
            });
        } catch (error) {
            if (
                error instanceof jwt.TokenExpiredError ||
                error instanceof jwt.JsonWebTokenError ||
                error instanceof jwt.NotBeforeError ||
                error instanceof HttpException
            ) {
                throw error;
            }

            this.logger.warn("Invalid refresh token attempt", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : String(error),
            });

            throw new HttpException(401, "Invalid refresh token");
        }
    }

    async register(registerData: RegisterRequest): Promise<AuthResponse> {
        const { email, password } = registerData;

        try {
            // Check if user already exists - repository will throw EntityExistsException
            const existingUser = await this.userRepository.existsByEmail(email);
            if (existingUser) {
                throw new EntityExistsException(
                    "User with this email already exists",
                );
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create new user
            const newUser = new UserEntity({
                email,
                password: hashedPassword,
                permissions: getDefaultPermissionsByRole(Role.USER),
                role: Role.USER,
                status: UserStatus.HAPPY,
            });

            const savedUser = await this.userRepository.saveUser(newUser);

            // Create JWT payload
            const jwtPayload: CustomJwtPayload = {
                email: savedUser.email,
                id: savedUser.id,
                name: savedUser.name,
                permissions: savedUser.permissions,
                role: savedUser.role,
                status: savedUser.status,
            };

            // Generate tokens
            const accessToken =
                await this.jwtService.generateAccessToken(jwtPayload);
            const refreshToken =
                await this.jwtService.generateRefreshToken(jwtPayload);

            // Convert entity to DTO
            const userDto = plainToClass(User, savedUser);

            this.logger.info(`New user registered: ${email}`);

            return new AuthResponse({
                accessToken: accessToken,
                expiresIn: ACCESS_TOKEN_EXPIRATION_SECONDS,
                message: "Registration successful",
                refreshToken: refreshToken,
                success: true,
                user: userDto,
            });
        } catch (error) {
            if (
                error instanceof jwt.TokenExpiredError ||
                error instanceof jwt.JsonWebTokenError ||
                error instanceof jwt.NotBeforeError ||
                error instanceof HttpException
            ) {
                throw error;
            }

            this.logger.error("Unexpected error during registration", {
                email,
                error: error instanceof Error ? error.message : String(error),
            });

            throw new HttpException(
                500,
                "Registration failed due to internal error",
            );
        }
    }
}
