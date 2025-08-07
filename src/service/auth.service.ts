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
import { CustomJwtPayload } from "@/type/interface/jwt";
import { ILogger } from "@/type/interface/logger.js";
import { JWT_EXPIRATION_TIME_IN_SECONDS } from "@/util/jwt.options.js";

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
                this.jwtService.generateAccessToken(jwtPayload);

            // Convert entity to DTO
            const userDto = plainToClass(User, user);

            this.logger.info(`Successful login for user: ${email}`);

            return new AuthResponse({
                accessToken,
                expiresIn: JWT_EXPIRATION_TIME_IN_SECONDS,
                message: "Login successful",
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

    logout(): { message: string; success: boolean } {
        // Since we're using stateless JWT tokens, logout is handled client-side
        // In the future, you might want to:
        // 1. Add token to a blacklist (requires Redis/database)
        // 2. Invalidate refresh tokens in database if stored there

        return {
            message: "Logout successful",
            success: true,
        };
    }

    async refreshToken(
        refreshToken: string,
        userJwtPayload: Express.User,
    ): Promise<AuthResponse> {
        try {
            this.logger.debug("Verifying token", {
                token: refreshToken.substring(0, 50) + "...", // Only log first 50 chars for security
            });

            // Verify refresh token - will throw if invalid
            const payload: CustomJwtPayload =
                this.jwtService.verifyToken(refreshToken);

            // Check if user still exists and is active
            const user = await this.userRepository.findById(payload.id);

            if (!user) {
                throw new HttpException(401, "User not found");
            }

            // Fix the comparison logic - compare the right fields
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

            // Create JWT payload
            const jwtPayload: CustomJwtPayload = {
                email: user.email,
                id: user.id,
                name: user.name,
                permissions: user.permissions,
                role: user.role,
                status: user.status,
            };

            const newAccessToken =
                this.jwtService.generateAccessToken(jwtPayload);

            this.logger.info(`Token refreshed for user: ${user.email}`);

            return new AuthResponse({
                expiresIn: JWT_EXPIRATION_TIME_IN_SECONDS,
                message: "Token refresh successful",
                refreshToken: newAccessToken,
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
            const accessToken = this.jwtService.generateAccessToken(jwtPayload);

            // Convert entity to DTO
            const userDto = plainToClass(User, savedUser);

            this.logger.info(`New user registered: ${email}`);

            return new AuthResponse({
                accessToken,
                expiresIn: JWT_EXPIRATION_TIME_IN_SECONDS,
                message: "Registration successful",
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
