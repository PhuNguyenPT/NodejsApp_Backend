import { Request } from "express";
// passport.config.ts
import { inject, injectable } from "inversify";
import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";

import { IUserRepository } from "@/repository/user.repository.interface.js";
import { TYPES } from "@/type/container/types.js";
import { ILogger } from "@/type/interface/logger.js";
import { strategyOptionsWithRequest } from "@/util/jwt.options.js";
import { config } from "@/util/validate.env";

@injectable()
export class PassportConfig {
    private isInitialized = false;

    constructor(
        @inject(TYPES.UserRepository)
        private userRepository: IUserRepository,
        @inject(TYPES.Logger)
        private logger: ILogger,
    ) {}

    public initializeStrategies(): void {
        if (this.isInitialized) {
            return;
        }

        // Cast to the specific type to avoid union type confusion
        const strategyOptions = strategyOptionsWithRequest;

        passport.use(
            new JwtStrategy(
                strategyOptions,
                (req: Request, payload: Express.User, done) => {
                    void (async () => {
                        try {
                            // Now you have access to the request object
                            const clientIP = req.ip ?? "unknown";
                            const userAgent =
                                req.headers["user-agent"] ?? "unknown";

                            const user = await this.userRepository.findById(
                                payload.id,
                            );

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
                                );

                                // Provide specific error messages based on account status
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
                                );
                                done(null, false, { message: "Access denied" });
                                return;
                            }

                            // Check for additional security constraints
                            if (this.isUserAgentSuspicious(userAgent)) {
                                this.logger.warn(
                                    `Suspicious user agent: ${userAgent} for user: ${user.id}`,
                                );
                                done(null, false, { message: "Access denied" });
                                return;
                            }

                            // Log successful authentication for audit purposes
                            this.logger.info(
                                `User ${user.id} authenticated successfully from IP: ${clientIP} - ${userAgent}`,
                            );

                            // Return user that conforms to Express.User (which extends JWTPayload)
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
                    const user = await this.userRepository.findById(id);

                    if (!user) {
                        this.logger.warn(
                            `User not found during deserialization: ${id}`,
                        );
                        done(null, null);
                        return;
                    }

                    // Check if user is still active during deserialization
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

    /**
     * Check for suspicious IPs
     */
    private isSuspiciousIP(ip: string): boolean {
        // Handle the case where IP might be 'unknown'
        if (ip === "unknown" || !ip) {
            return false; // or true, depending on your security policy
        }

        // In development, allow localhost/loopback addresses
        const isDevelopment = config.NODE_ENV === "development";
        const isLocalhost =
            ip === "127.0.0.1" ||
            ip === "::1" ||
            ip.startsWith("127.") ||
            ip === "localhost";

        if (isDevelopment && isLocalhost) {
            this.logger.debug(
                `Allowing localhost access in development mode: ${ip}`,
            );
            return false;
        }

        // Example: Block certain IP ranges or known bad IPs
        const blockedIPs = [
            "127.0.0.1", // IPv4 localhost (blocked in production)
            "::1", // IPv6 localhost (blocked in production)
            "0.0.0.0", // IPv4 any address
            "::", // IPv6 any address
            "192.168.1.100", // Example blocked IP
            // Add more as needed
        ];

        const suspiciousPatterns = [
            /^127\./, // Block all 127.x.x.x (IPv4 loopback range) in production
            /^::1$/, // IPv6 localhost in production
            /^::ffff:127\./, // IPv4-mapped IPv6 localhost in production
            /^10\./, // Private network 10.x.x.x (uncomment if needed)
            /^192\.168\./, // Private network 192.168.x.x (uncomment if needed)
            /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private network 172.16-31.x.x (uncomment if needed)
            // Add more patterns as needed
        ];

        // In production/staging, block localhost and private networks
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

        const suspiciousPatterns = [
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
