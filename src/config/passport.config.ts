import { Request } from "express";
// passport.config.ts
import { inject, injectable } from "inversify";
import passport from "passport";
import { Strategy as JwtStrategy } from "passport-jwt";

import { IUserRepository } from "@/repository/user.repository.interface";
import { TYPES } from "@/type/container/types";
import { UserStatus } from "@/type/enum/user.status.js";
import { ILogger } from "@/type/interface/logger";
import { strategyOptionsWithRequest } from "@/util/jwt.options.js";

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
                                done(null, false, {
                                    message: "User not found",
                                });
                                return;
                            }

                            if (user.status !== UserStatus.HAPPY) {
                                done(null, false, {
                                    message: "Account is not active",
                                });
                                return;
                            }

                            if (user.email !== payload.email) {
                                done(null, false, {
                                    message: "Token payload mismatch",
                                });
                                return;
                            }

                            // Example: Additional security checks using request data
                            // Check for suspicious IP patterns
                            if (this.isSuspiciousIP(clientIP)) {
                                this.logger.warn(
                                    `Suspicious login attempt from IP: ${clientIP} for user: ${user.id}`,
                                );
                                done(null, false, { message: "Access denied" });
                                return;
                            }

                            // Example: Log authentication for audit purposes
                            this.logger.info(
                                `User ${user.id} authenticated from IP: ${clientIP} - ${userAgent}`,
                            );

                            // Return user that conforms to Express.User (which extends JWTPayload)
                            const userPayload: Express.User = {
                                email: user.email,
                                exp: payload.exp,
                                iat: payload.iat,
                                id: user.id,
                                name: user.name,
                                status: user.status,
                            };

                            done(null, userPayload);
                        } catch (error) {
                            this.logger.error("JWT Strategy Error:", {
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : String(error),
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

                    if (user) {
                        const userPayload: Express.User = {
                            email: user.email,
                            id: user.id,
                            name: user.name,
                            status: user.status,
                        };
                        done(null, userPayload);
                    } else {
                        done(null, null);
                    }
                } catch (error) {
                    done(error, null);
                }
            })();
        });

        this.isInitialized = true;
    }

    /**
     * Example method to check for suspicious IPs
     * You can implement your own logic here
     */
    private isSuspiciousIP(ip: string): boolean {
        // Handle the case where IP might be 'unknown'
        if (ip === "unknown" || !ip) {
            return false; // or true, depending on your security policy
        }

        // Example: Block certain IP ranges or known bad IPs
        const blockedIPs = [
            "192.168.1.100", // Example blocked IP
            // Add more as needed
        ];

        const suspiciousPatterns = [
            /^10\.0\.0\./, // Block certain IP patterns
            // Add more patterns as needed
        ];

        if (blockedIPs.includes(ip)) {
            return true;
        }

        return suspiciousPatterns.some((pattern) => pattern.test(ip));
    }
}
