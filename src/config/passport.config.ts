// passport.config.ts

import { Request } from "express";
import { inject, injectable } from "inversify";
import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";
import { Repository } from "typeorm";
import { Logger } from "winston";

import {
    JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS,
    strategyOptionsWithRequest,
} from "@/config/jwt.config.js";
import { TokenType } from "@/entity/jwt.entity.js";
import { UserEntity } from "@/entity/user.entity.js";
import { IJwtTokenRepository } from "@/repository/jwt-token-repository-interface.js";
import { TYPES } from "@/type/container/types.js";
import { CustomJwtPayload } from "@/type/interface/jwt.interface.js";
import { CacheKeys } from "@/util/cache-key.js";
import { config } from "@/util/validate-env.js";

@injectable()
export class PassportConfig {
    private isInitialized = false;

    constructor(
        @inject(TYPES.UserRepository)
        private userRepository: Repository<UserEntity>,
        @inject(TYPES.IJwtTokenRepository)
        private readonly jwtTokenRepository: IJwtTokenRepository,
        @inject(TYPES.Logger)
        private logger: Logger,
    ) {}

    public initializeStrategies(): void {
        if (this.isInitialized) {
            return;
        }

        const strategyOptions = strategyOptionsWithRequest;

        passport.use(
            new JwtStrategy(
                strategyOptions,
                (req: Request, payload: CustomJwtPayload, done) => {
                    void (async () => {
                        try {
                            if (payload.type !== TokenType.ACCESS) {
                                this.logger.warn(
                                    `Incorrect token type used. Expected '${TokenType.ACCESS}', got '${payload.type}'.`,
                                    { clientIP: req.ip, userId: payload.id },
                                );
                                done(null, false, {
                                    message: `Invalid token type. This endpoint requires an '${TokenType.ACCESS}' token.`,
                                });
                                return;
                            }
                            const clientIP = req.ip ?? "unknown";
                            const userAgent =
                                req.headers["user-agent"] ?? "unknown";

                            // Extract the raw JWT token from the request
                            const authHeader = req.headers.authorization;
                            let rawToken: null | string = null;

                            if (authHeader?.startsWith("Bearer ")) {
                                rawToken = authHeader.substring(7);
                            }

                            if (!rawToken) {
                                this.logger.warn(
                                    "No token found in authorization header",
                                );
                                done(null, false, {
                                    message: "Authentication token is required",
                                });
                                return;
                            }

                            let isFallbackMode = false;

                            try {
                                // 1. FIRST: Check if token is blacklisted (logout/revoked tokens)
                                const isBlacklisted =
                                    await this.jwtTokenRepository.isTokenBlacklisted(
                                        rawToken,
                                    );
                                if (isBlacklisted) {
                                    this.logger.warn(
                                        `Blacklisted token access attempt for user: ${payload.id}`,
                                        {
                                            clientIP,
                                            reason: "token_blacklisted",
                                            tokenId: payload.id,
                                            userAgent,
                                        },
                                    );
                                    done(null, false, {
                                        message:
                                            "Token has been revoked. Please log in again.",
                                    });
                                    return;
                                }

                                // 2. Check if token exists in Redis storage
                                const tokenInfo =
                                    await this.jwtTokenRepository.findByToken(
                                        rawToken,
                                    );

                                if (!tokenInfo) {
                                    this.logger.warn(
                                        `Token not found in storage for user: ${payload.id}`,
                                        {
                                            clientIP,
                                            reason: "token_not_found",
                                            userAgent,
                                        },
                                    );
                                    done(null, false, {
                                        message:
                                            "Invalid or expired token. Please log in again.",
                                    });
                                    return;
                                }

                                // 3. Check if token is expired in Redis (additional layer)
                                if (tokenInfo.isExpired()) {
                                    this.logger.warn(
                                        `Expired token in storage for user: ${payload.id}`,
                                        {
                                            clientIP,
                                            reason: "token_expired_redis",
                                            userAgent,
                                        },
                                    );

                                    // Auto-cleanup expired token
                                    await this.jwtTokenRepository.blacklistTokenByValue(
                                        rawToken,
                                    );

                                    done(null, false, {
                                        message:
                                            "Token has expired. Please log in again.",
                                    });
                                    return;
                                }

                                // 4. Validate token is still valid (not marked invalid for other reasons)
                                if (!tokenInfo.isValid()) {
                                    this.logger.warn(
                                        `Invalid token state for user: ${payload.id}`,
                                        {
                                            clientIP,
                                            reason: "token_invalid_state",
                                            userAgent,
                                        },
                                    );
                                    done(null, false, {
                                        message:
                                            "Invalid token. Please log in again.",
                                    });
                                    return;
                                }

                                // 5. Validate token type if it is ACCESS token type
                                if (!(tokenInfo.type === TokenType.ACCESS)) {
                                    this.logger.warn(
                                        `Invalid token type ${tokenInfo.type} for user: ${payload.id}`,
                                        {
                                            clientIP,
                                            reason: "token_invalid_type",
                                            userAgent,
                                        },
                                    );
                                    done(null, false, {
                                        message:
                                            "Invalid token type. This endpoint requires an access token.",
                                    });
                                    return;
                                }
                            } catch (redisError) {
                                this.logger.error(
                                    "Redis token validation error:",
                                    {
                                        clientIP,
                                        error:
                                            redisError instanceof Error
                                                ? redisError.message
                                                : String(redisError),
                                        userId: payload.id,
                                    },
                                );

                                isFallbackMode = true;
                                // Option B: Fall back to JWT-only validation
                                this.logger.warn(
                                    "Falling back to JWT-only validation due to Redis error",
                                    {
                                        clientIP,
                                        userAgent,
                                        userId: payload.id,
                                    },
                                );
                            }

                            // Find user in database
                            const user = await this.findUserById(payload.id);
                            if (!user) {
                                this.logger.warn(
                                    `User not found for ID: ${payload.id}`,
                                );
                                done(null, false, {
                                    message: "User not found",
                                });
                                return;
                            }

                            // Check account status
                            if (!user.isAccountActive()) {
                                this.logger.warn(
                                    `Inactive account access attempt for user: ${user.id}`,
                                    {
                                        clientIP,
                                        userAgent,
                                    },
                                );

                                let message = "Account is not active";
                                if (!user.isEnabled()) {
                                    message = "Account is disabled";
                                } else if (!user.isAccountNonLocked()) {
                                    message = "Account is locked";
                                } else if (!user.isAccountNonExpired()) {
                                    message = "Account has expired";
                                } else if (!user.isCredentialsNonExpired()) {
                                    message = "Credentials have expired";
                                }

                                done(null, false, { message });
                                return;
                            }

                            // Verify token payload matches user data
                            if (user.email !== payload.email) {
                                this.logger.warn(
                                    `Token payload mismatch for user: ${user.id}`,
                                    {
                                        clientIP,
                                        tokenEmail: payload.email,
                                        userAgent,
                                        userEmail: user.email,
                                    },
                                );
                                done(null, false, {
                                    message: "Token payload mismatch",
                                });
                                return;
                            }

                            // Additional security checks using request data
                            if (this.isSuspiciousIP(clientIP)) {
                                this.logger.warn(
                                    `Suspicious login attempt from IP: ${clientIP} for user: ${user.id}`,
                                    {
                                        userAgent,
                                    },
                                );
                                done(null, false, { message: "Access denied" });
                                return;
                            }

                            if (this.isUserAgentSuspicious(userAgent)) {
                                this.logger.warn(
                                    `Suspicious user agent: ${userAgent} for user: ${user.id}`,
                                    {
                                        clientIP,
                                    },
                                );
                                done(null, false, { message: "Access denied" });
                                return;
                            }

                            // Log successful authentication for audit purposes
                            this.logger.info(
                                `User ${user.id} authenticated successfully`,
                                {
                                    clientIP,
                                    fallbackMode: isFallbackMode, // Track when Redis was bypassed
                                    tokenValid: true,
                                    userAgent,
                                },
                            );

                            // Return user that conforms to Express.User
                            const userPayload: Express.User = {
                                email: user.email,
                                exp: payload.exp,
                                iat: payload.iat,
                                id: user.id,
                                name: user.name,
                                permissions: user.permissions,
                                role: user.role,
                                status: user.status,
                            };

                            done(null, userPayload);
                        } catch (error) {
                            this.logger.error("JWT Strategy Error:", {
                                clientIP: req.ip,
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : String(error),
                                userAgent: req.headers["user-agent"],
                                userId: payload.id,
                            });
                            done(error, false);
                        }
                    })();
                },
            ),
        );

        // Serialize user
        passport.serializeUser((user: Express.User, done) => {
            done(null, user.id);
        });

        // Deserialize user
        passport.deserializeUser((id: string, done) => {
            void (async () => {
                try {
                    const user = await this.findUserById(id);

                    if (!user) {
                        this.logger.warn(
                            `User not found during deserialization: ${id}`,
                        );
                        done(null, null);
                        return;
                    }

                    if (!user.isAccountActive()) {
                        this.logger.warn(
                            `Inactive user during deserialization: ${id}`,
                        );
                        done(null, null);
                        return;
                    }

                    const userPayload: Express.User = {
                        email: user.email,
                        id: user.id,
                        name: user.name,
                        permissions: user.permissions,
                        role: user.role,
                        status: user.status,
                    };
                    done(null, userPayload);
                } catch (error) {
                    this.logger.error("User deserialization error:", {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        userId: id,
                    });
                    done(error, null);
                }
            })();
        });

        this.isInitialized = true;
    }

    private async findUserById(userId: string): Promise<null | UserEntity> {
        return await this.userRepository.findOne({
            cache: {
                id: CacheKeys.user(userId),
                milliseconds: JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS,
            },
            where: { id: userId },
        });
    }

    /**
     * Check for suspicious IPs
     */
    private isSuspiciousIP(ip: string): boolean {
        if (ip === "unknown" || !ip) {
            return false;
        }

        // const isDevelopment: boolean = config.NODE_ENV === "development";
        // const isLocalhost: boolean =
        //     ip === "127.0.0.1" ||
        //     ip === "::1" ||
        //     ip.startsWith("127.") ||
        //     ip === "localhost";

        // if (isDevelopment && isLocalhost) {
        //     this.logger.debug(
        //         `Allowing localhost access in development mode: ${ip}`,
        //     );
        //     return false;
        // }

        const blockedIPs: string[] = [
            // "127.0.0.1", // IPv4 localhost (blocked in production)
            // "::1", // IPv6 localhost (blocked in production)
            // "0.0.0.0", // IPv4 any address
            // "::", // IPv6 any address
            // "192.168.1.100", // Example blocked IP
            // Add more as needed
        ];

        const suspiciousPatterns: RegExp[] = [
            // /^127\./, // Block all 127.x.x.x (IPv4 loopback range) in production
            // /^::1$/, // IPv6 localhost in production
            // /^::ffff:127\./, // IPv4-mapped IPv6 localhost in production
            // /^10\./, // Private network 10.x.x.x (uncomment if needed)
            // /^192\.168\./, // Private network 192.168.x.x (uncomment if needed)
            // /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private network 172.16-31.x.x (uncomment if needed)
            // Add more patterns as needed
        ];

        if (config.NODE_ENV === "production" || config.NODE_ENV === "staging") {
            if (blockedIPs.includes(ip)) {
                return true;
            }

            if (suspiciousPatterns.some((pattern) => pattern.test(ip))) {
                return true;
            }
        }

        // Additional custom blocked IPs that apply to all environments
        const alwaysBlockedIPs: string[] = [
            // Add IPs that should be blocked in all environments
        ];

        return alwaysBlockedIPs.includes(ip);
    }

    /**
     * Check for suspicious user agents
     */
    private isUserAgentSuspicious(userAgent: string): boolean {
        if (userAgent === "unknown" || !userAgent) {
            return true; // Block requests without user agent
        }

        const suspiciousPatterns: RegExp[] = [
            /bot/i, // Generic bot pattern
            /crawler/i, // Web crawlers
            /spider/i, // Web spiders
            /curl/i, // Command line tools
            /wget/i, // Command line tools
            /postman/i, // API testing tools (uncomment if needed)
            // Add more patterns as needed
        ];

        return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
    }
}
