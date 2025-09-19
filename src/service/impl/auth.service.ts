// src/service/auth.service.ts
import bcrypt from "bcrypt";
import { plainToClass } from "class-transformer";
import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
import { Repository } from "typeorm";

import { LoginRequest, RegisterRequest } from "@/dto/auth/auth-request.js";
import { AuthResponse } from "@/dto/auth/auth-response.js";
import { User } from "@/dto/user/user.js";
import { TokenType } from "@/entity/jwt.entity.js";
import { UserEntity } from "@/entity/user.entity.js";
import { IJwtTokenRepository } from "@/repository/jwt-token-repository-interface.js";
import { JwtEntityService } from "@/service/impl/jwt-entity.service.js";
import { JWTService } from "@/service/impl/jwt.service.js";
import { TYPES } from "@/type/container/types.js";
import {
    getDefaultPermissionsByRole,
    Role,
    UserStatus,
} from "@/type/enum/user.js";
import { AccessDeniedException } from "@/type/exception/access-denied.exception.js";
import { AuthenticationException } from "@/type/exception/authentication.exception.js";
import { BadCredentialsException } from "@/type/exception/bad-credentials.exception.js";
import { EntityExistsException } from "@/type/exception/entity-exists.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { HttpException } from "@/type/exception/http.exception.js";
import { JwtException } from "@/type/exception/jwt.exception.js";
import { CustomJwtPayload } from "@/type/interface/jwt.interface.js";
import { ILogger } from "@/type/interface/logger.interface.js";
import { JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS } from "@/util/jwt-options.js";

@injectable()
export class AuthService {
    constructor(
        @inject(TYPES.UserRepository)
        private userRepository: Repository<UserEntity>,
        @inject(TYPES.JWTService) private readonly jwtService: JWTService,
        @inject(TYPES.JwtEntityService)
        private readonly jwtEntityService: JwtEntityService,
        @inject(TYPES.IJwtTokenRepository)
        private readonly jwtTokenRepository: IJwtTokenRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async login(loginData: LoginRequest): Promise<AuthResponse> {
        const { email, password } = loginData;

        try {
            // Find user by email - will throw EntityNotFoundException if not found
            const user = await this.userRepository.findOneBy({ email });

            if (!user) {
                throw new BadCredentialsException();
            }

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
            const accessTokenJwtPayload: CustomJwtPayload = {
                email: user.email,
                id: user.id,
                name: user.name,
                permissions: user.permissions,
                role: user.role,
                status: user.status,
                type: TokenType.ACCESS,
            };

            const familyId = randomUUID(); // Create ONE familyId for this session

            // Pass this familyId when generating tokens
            const accessToken: string =
                await this.jwtService.generateAccessToken(
                    accessTokenJwtPayload,
                    familyId,
                );

            const refreshTokenJwtPayload: CustomJwtPayload = {
                email: user.email,
                id: user.id,
                name: user.name,
                permissions: user.permissions,
                role: user.role,
                status: user.status,
                type: TokenType.REFRESH,
            };
            const refreshToken = await this.jwtService.generateRefreshToken(
                refreshTokenJwtPayload,
                familyId,
            );

            // Convert entity to DTO
            const userDto = plainToClass(User, user);

            this.logger.info(`Successful login for user: ${email}`);

            return new AuthResponse({
                accessToken: accessToken,
                expiresIn: JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS,
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

            // Validate access token if provided
            if (accessToken) {
                const accessJwtEntity =
                    await this.jwtEntityService.getTokenInfo(accessToken);
                if (!accessJwtEntity) {
                    this.logger.warn("Access token not found during logout");
                } else {
                    if (accessJwtEntity.isBlacklisted) {
                        this.logger.debug("Access token already blacklisted");
                    } else {
                        // Validate token type
                        this.validateTokenType(
                            TokenType.ACCESS,
                            accessJwtEntity.type,
                        );
                        tokensToBlacklist.push(accessToken);
                    }
                }
            }

            // Validate refresh token if provided
            if (refreshToken) {
                const refreshJwtEntity =
                    await this.jwtEntityService.getTokenInfo(refreshToken);
                if (!refreshJwtEntity) {
                    this.logger.warn("Refresh token not found during logout");
                } else {
                    if (refreshJwtEntity.isBlacklisted) {
                        this.logger.debug("Refresh token already blacklisted");
                    } else {
                        // Validate token type
                        this.validateTokenType(
                            TokenType.REFRESH,
                            refreshJwtEntity.type,
                        );
                        tokensToBlacklist.push(refreshToken);
                    }
                }
            }

            if (tokensToBlacklist.length === 0) {
                this.logger.info(
                    "No tokens to blacklist during logout (all may be expired/blacklisted)",
                );
                return {
                    message: "Logout successful - no active tokens found",
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
            if (error instanceof BadCredentialsException) {
                throw error;
            }

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

    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        try {
            this.logger.debug("Processing token refresh request");

            // 1. Get token entity to check for reuse and get its familyId
            const oldRefreshJwtEntity =
                await this.jwtEntityService.getTokenInfo(refreshToken);

            // 2. CRITICAL: Check for token reuse (stolen token detection)
            if (!oldRefreshJwtEntity) {
                this.logger.warn(
                    "Refresh token not found - possible cleanup or invalid token",
                );
                throw new JwtException("Invalid refresh token");
            }

            if (!oldRefreshJwtEntity.isValid()) {
                if (oldRefreshJwtEntity.isBlacklisted) {
                    this.logger.error(
                        "SECURITY ALERT: Blacklisted refresh token reuse detected",
                        {
                            familyId: oldRefreshJwtEntity.familyId,
                            tokenId: oldRefreshJwtEntity.id,
                        },
                    );
                } else if (oldRefreshJwtEntity.isExpired()) {
                    this.logger.warn("Expired refresh token used", {
                        familyId: oldRefreshJwtEntity.familyId,
                        tokenId: oldRefreshJwtEntity.id,
                    });
                }

                // Invalidate the entire family of tokens for security
                this.logger.warn(
                    `Refresh token reuse/misuse detected. Invalidating family: ${oldRefreshJwtEntity.familyId}`,
                );
                await this.jwtTokenRepository.invalidateFamily(
                    oldRefreshJwtEntity.familyId,
                );
                throw new JwtException("Invalid or reused refresh token");
            }

            // 3. Verify the token's signature and expiration
            let payload: CustomJwtPayload;
            try {
                payload = await this.jwtService.verifyToken(refreshToken);
            } catch (verifyError) {
                // f JWT verification fails, still invalidate family as precaution
                this.logger.error("JWT verification failed during refresh", {
                    error:
                        verifyError instanceof Error
                            ? verifyError.message
                            : String(verifyError),
                    familyId: oldRefreshJwtEntity.familyId,
                });
                await this.jwtTokenRepository.invalidateFamily(
                    oldRefreshJwtEntity.familyId,
                );
                throw verifyError;
            }

            // 4. IMPORTANT: Check the user's current status in the database
            const user = await this.userRepository.findOneBy({
                id: payload.id,
            });

            if (!user) {
                this.logger.warn("Token refresh failed: user not found", {
                    familyId: oldRefreshJwtEntity.familyId,
                    userId: payload.id,
                });
                // Invalidate family since user no longer exists
                await this.jwtTokenRepository.invalidateFamily(
                    oldRefreshJwtEntity.familyId,
                );
                throw new AuthenticationException("User not found");
            }

            // Check if account is NOT active
            if (!user.isAccountActive()) {
                this.logger.warn("Token refresh failed: account inactive", {
                    active: user.isAccountActive(),
                    familyId: oldRefreshJwtEntity.familyId,
                    userId: payload.id,
                });
                // Invalidate family since account is inactive
                await this.jwtTokenRepository.invalidateFamily(
                    oldRefreshJwtEntity.familyId,
                );
                throw new AccessDeniedException("Account is no longer active");
            }

            // 5. Blacklist the old refresh token immediately to prevent reuse
            await this.jwtService.logout(refreshToken);

            // 6. Generate NEW tokens using the same familyId
            const familyId = oldRefreshJwtEntity.familyId;

            // Create JWT payload with fresh user data from database
            const accessTokenJwtPayload: CustomJwtPayload = {
                email: user.email,
                id: user.id,
                name: user.name,
                permissions: user.permissions,
                role: user.role,
                status: user.status,
                type: TokenType.ACCESS,
            };

            // Generate new tokens
            const newAccessToken = await this.jwtService.generateAccessToken(
                accessTokenJwtPayload,
                familyId,
            );
            const refreshTokenJwtPayload: CustomJwtPayload = {
                email: user.email,
                id: user.id,
                name: user.name,
                permissions: user.permissions,
                role: user.role,
                status: user.status,
                type: TokenType.REFRESH,
            };
            const newRefreshToken = await this.jwtService.generateRefreshToken(
                refreshTokenJwtPayload,
                familyId,
            );

            // Convert entity to DTO
            const userDto = plainToClass(User, user);

            this.logger.info(
                `Token refresh successful for user: ${user.email}`,
                {
                    familyId,
                    userId: user.id,
                },
            );

            return new AuthResponse({
                accessToken: newAccessToken,
                expiresIn: JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS,
                message: "Token refresh successful",
                refreshToken: newRefreshToken,
                success: true,
                user: userDto,
            });
        } catch (error) {
            // Re-throw known exceptions
            if (
                error instanceof BadCredentialsException ||
                error instanceof JwtException ||
                error instanceof AuthenticationException ||
                error instanceof AccessDeniedException ||
                error instanceof jwt.TokenExpiredError ||
                error instanceof jwt.JsonWebTokenError ||
                error instanceof jwt.NotBeforeError ||
                error instanceof HttpException
            ) {
                throw error;
            }

            this.logger.error("Unexpected error during token refresh", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });

            throw new HttpException(401, "Invalid refresh token");
        }
    }

    async register(registerData: RegisterRequest): Promise<AuthResponse> {
        const { email, password } = registerData;

        try {
            const savedUser = await this.createAndSaveUser(email, password);

            // Create JWT payload
            const accessTokenJwtPayload: CustomJwtPayload = {
                email: savedUser.email,
                id: savedUser.id,
                name: savedUser.name,
                permissions: savedUser.permissions,
                role: savedUser.role,
                status: savedUser.status,
                type: TokenType.ACCESS,
            };

            const familyId = randomUUID();
            // Generate tokens
            const accessToken = await this.jwtService.generateAccessToken(
                accessTokenJwtPayload,
                familyId,
            );

            const refreshTokenJwtPayload: CustomJwtPayload = {
                email: savedUser.email,
                id: savedUser.id,
                name: savedUser.name,
                permissions: savedUser.permissions,
                role: savedUser.role,
                status: savedUser.status,
                type: TokenType.REFRESH,
            };

            const refreshToken = await this.jwtService.generateRefreshToken(
                refreshTokenJwtPayload,
                familyId,
            );

            // Convert entity to DTO
            const userDto = plainToClass(User, savedUser);

            this.logger.info(`Registration completed successfully`, {
                accessTokenPrefix: accessToken.substring(0, 10),
                email,
                refreshTokenPrefix: refreshToken.substring(0, 10),
                userId: savedUser.id,
            });
            return new AuthResponse({
                accessToken: accessToken,
                expiresIn: JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS,
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

    private async createAndSaveUser(
        email: string,
        password: string,
    ): Promise<UserEntity> {
        const savedUser = await this.userRepository.manager.transaction(
            async (transactionalEntityManager) => {
                // Check if user exists with pessimistic write lock to prevent race conditions
                const existingUser = await transactionalEntityManager.findOne(
                    UserEntity,
                    {
                        lock: {
                            mode: "pessimistic_write",
                            onLocked: "nowait", // Fail immediately if can't acquire lock
                        },
                        where: { email },
                    },
                );

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

                // Save user within transaction
                const savedUser =
                    await transactionalEntityManager.save(newUser);

                // Move logging to its own statement to fix ESLint error
                this.logger.info(`User entity created successfully`, {
                    email: savedUser.email,
                    userId: savedUser.id,
                });

                return savedUser; // Return the saved user from transaction
            },
        );

        return savedUser;
    }

    /**
     * Determine if refresh token should be rotated
     * You can customize this logic based on your security requirements
     */
    private shouldRotateRefreshToken(
        exp: number,
        thresholdHours = 24,
    ): boolean {
        try {
            const now = Date.now();
            const tokenExpiryMs = exp * 1000;
            const timeUntilExpiry = tokenExpiryMs - now;
            const thresholdMs = thresholdHours * 60 * 60 * 1000;

            const isExpiringSoon = timeUntilExpiry < thresholdMs;

            this.logger.debug("Token expiration check", {
                isExpiringSoon,
                thresholdHours,
                timeUntilExpiryHours: Math.floor(
                    timeUntilExpiry / (60 * 60 * 1000),
                ),
                tokenExpiresAt: new Date(tokenExpiryMs).toISOString(),
            });
            return isExpiringSoon;
        } catch (error) {
            this.logger.error("Error checking token for rotation", { error });
            return true; // Default to rotation on error
        }
    }

    /**
     * Validates that a token has the expected type
     * @param token - The JWT token to validate
     * @param expectedType - The expected token type (ACCESS or REFRESH)
     * @throws BadCredentialsException if token type doesn't match
     */
    private validateTokenType(
        expectedType: TokenType,
        tokenType?: TokenType,
    ): void {
        try {
            if (!tokenType) {
                this.logger.warn(
                    `Token validation failed: ${expectedType} not found in storage`,
                );
                throw new BadCredentialsException(`Invalid ${expectedType}`);
            }

            if (tokenType !== expectedType) {
                this.logger.warn(
                    `Token validation failed: expected ${expectedType} but got ${tokenType}`,
                    {
                        actualType: tokenType,
                        expectedType,
                    },
                );
                throw new BadCredentialsException(
                    `Invalid provided ${tokenType} token type. Must be ${expectedType} token type`,
                );
            }

            this.logger.debug(
                `Token type validation successful: ${expectedType} token type`,
            );
        } catch (error) {
            // Re-throw BadCredentialsException as-is
            if (error instanceof BadCredentialsException) {
                throw error;
            }

            // Log unexpected errors and throw BadCredentialsException
            this.logger.error(
                `Unexpected error during ${expectedType} token type validation`,
                {
                    error:
                        error instanceof Error ? error.message : String(error),
                    expectedType,
                },
            );
            throw new BadCredentialsException(
                `Invalid ${expectedType} token type`,
            );
        }
    }
}
