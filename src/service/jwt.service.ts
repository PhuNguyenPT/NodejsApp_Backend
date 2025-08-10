// src/service/jwt.service.ts
import { inject, injectable } from "inversify";
import jwt, { JwtPayload } from "jsonwebtoken";

import { TokenType } from "@/entity/jwt.entity.js";
import { KeyStore } from "@/type/class/keystore.js";
import { TYPES } from "@/type/container/types.js";
import { CustomJwtPayload } from "@/type/interface/jwt.js";
import { ILogger } from "@/type/interface/logger.js";
import {
    REFRESH_TOKEN_EXPIRATION_SECONDS,
    refreshSignOptions,
    signOptions,
    verifyOptions,
} from "@/util/jwt.options.js";

import { JwtEntityService } from "./jwt.token.service.js";

@injectable()
export class JWTService {
    constructor(
        @inject(TYPES.KeyStore)
        private keyStore: KeyStore,
        @inject(TYPES.Logger)
        private logger: ILogger,
        @inject(TYPES.JwtEntityService)
        private jwtEntityService: JwtEntityService,
    ) {}

    /**
     * Cleanup expired tokens (should be called periodically)
     */
    async cleanupExpiredTokens(): Promise<number> {
        try {
            return await this.jwtEntityService.cleanupExpiredTokens();
        } catch (error) {
            this.logger.error("Error cleaning up expired tokens:", { error });
            return 0;
        }
    }

    /**
     * Decode token without verification (existing method - unchanged)
     */
    decodeToken(token: string): CustomJwtPayload | null {
        try {
            const decoded = jwt.decode(token);

            if (!decoded || typeof decoded === "string") {
                return null;
            }

            if (!this.isValidCustomPayload(decoded)) {
                return null;
            }

            return decoded;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error("Token decode failed", error);
            }
            throw new Error("Token decode failed");
        }
    }

    /**
     * Generate JWT access token for user and store it in Redis
     */
    async generateAccessToken(payload: CustomJwtPayload): Promise<string> {
        try {
            const token = jwt.sign(
                payload,
                this.keyStore.getPrivateKey(),
                signOptions,
            );

            const ttl = this.extractTtlFromOptions(signOptions.expiresIn);
            await this.jwtEntityService.createToken(
                token,
                ttl,
                TokenType.ACCESS,
            );

            // Reduce logging verbosity - only log in debug mode
            this.logger.debug(`Access token generated for user: ${payload.id}`);
            return token;
        } catch (error) {
            this.logger.error("Access token generation failed", {
                error: error instanceof Error ? error.message : String(error),
                userId: payload.id,
            });
            throw new Error("Token generation failed");
        }
    }

    /**
     * Generate refresh token and store it in Redis
     */
    async generateRefreshToken(payload: CustomJwtPayload): Promise<string> {
        try {
            const token = jwt.sign(
                payload,
                this.keyStore.getPrivateKey(),
                refreshSignOptions,
            );

            await this.jwtEntityService.createToken(
                token,
                REFRESH_TOKEN_EXPIRATION_SECONDS,
                TokenType.REFRESH,
            );

            // Reduce logging verbosity - only log in debug mode
            this.logger.debug(
                `Refresh token generated for user: ${payload.id}`,
            );
            return token;
        } catch (error) {
            this.logger.error("Refresh token generation failed", {
                error: error instanceof Error ? error.message : String(error),
                userId: payload.id,
            });
            throw new Error("Refresh token generation failed");
        }
    }

    /**
     * Get token information from Redis
     */
    async getTokenInfo(token: string) {
        try {
            return await this.jwtEntityService.getTokenInfo(token);
        } catch (error) {
            this.logger.error("Error getting token info:", { error });
            return null;
        }
    }

    /**
     * Check if token is blacklisted
     */
    async isTokenBlacklisted(token: string): Promise<boolean> {
        try {
            return await this.jwtEntityService.isTokenBlacklisted(token);
        } catch (error) {
            this.logger.error("Error checking token blacklist status:", {
                error,
            });
            return true; // Default to blacklisted for security
        }
    }

    /**
     * Check if token is expired without throwing (updated to include Redis check)
     */
    async isTokenExpired(token: string): Promise<boolean> {
        try {
            await this.verifyToken(token);
            return false;
        } catch (error) {
            return (
                error instanceof Error &&
                (error.message === "Token has expired" ||
                    error.message === "Invalid or blacklisted token")
            );
        }
    }

    /**
     * Logout user by blacklisting their token
     */
    async logout(token: string): Promise<boolean> {
        try {
            const success = await this.jwtEntityService.blacklistToken(token);

            // Only log once per token, not multiple times
            if (!success) {
                this.logger.debug("Token not found during logout attempt");
            }

            return success;
        } catch (error) {
            this.logger.error("Token blacklist error", {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(
        refreshToken: string,
    ): Promise<{ accessToken: string; newRefreshToken?: string }> {
        try {
            // Verify refresh token
            const payload = await this.verifyToken(refreshToken);

            // Generate new access token
            const newAccessToken = await this.generateAccessToken({
                email: payload.email,
                id: payload.id,
                name: payload.name,
                permissions: payload.permissions,
                role: payload.role,
                status: payload.status,
            });

            // Optionally, generate new refresh token and invalidate old one
            const newRefreshToken = await this.generateRefreshToken({
                email: payload.email,
                id: payload.id,
                name: payload.name,
                permissions: payload.permissions,
                role: payload.role,
                status: payload.status,
            });

            // Blacklist old refresh token
            await this.jwtEntityService.blacklistToken(refreshToken);

            this.logger.info(`Tokens refreshed for user: ${payload.id}`);
            return {
                accessToken: newAccessToken,
                newRefreshToken: newRefreshToken,
            };
        } catch (error) {
            this.logger.error("Failed to refresh tokens:", { error });
            throw new Error("Token refresh failed");
        }
    }

    /**
     * Verify JWT token with Redis validation
     * This method now checks both JWT validity AND Redis storage/blacklist status
     */
    async verifyToken(token: string): Promise<CustomJwtPayload> {
        try {
            // First, check if token exists and is not blacklisted in Redis
            const isValidInRedis =
                await this.jwtEntityService.validateToken(token);
            if (!isValidInRedis) {
                this.logger.warn(
                    "Token validation failed in Redis (not found, expired, or blacklisted)",
                );
                throw new Error("Invalid or blacklisted token");
            }

            // Then verify JWT signature and expiration
            const decoded = jwt.verify(
                token,
                this.keyStore.getPublicKey(),
                verifyOptions,
            );

            if (typeof decoded === "string") {
                this.logger.error("Invalid token format", { decoded });
                throw new Error("Invalid token format");
            }

            if (!this.isValidCustomPayload(decoded)) {
                this.logger.error("Invalid token payload structure", {
                    payload: decoded,
                });
                throw new Error("Invalid token payload structure");
            }

            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                // If JWT is expired, also blacklist it in Redis
                await this.jwtEntityService.blacklistToken(token);
                throw new Error("Token has expired");
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("Invalid token");
            } else if (error instanceof Error) {
                throw error;
            } else {
                throw new Error("Token verification failed");
            }
        }
    }

    /**
     * Helper method to extract TTL from JWT expiration options
     */
    private extractTtlFromOptions(
        expiresIn: number | string | undefined,
    ): number {
        if (!expiresIn) {
            return 3600; // Default 1 hour
        }

        if (typeof expiresIn === "number") {
            return expiresIn;
        }

        // Parse string formats like '1d', '24h', '3600s'
        const match = /^(\d+)([smhd])$/.exec(expiresIn);
        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2];

            switch (unit) {
                case "d":
                    return value * 24 * 60 * 60;
                case "h":
                    return value * 60 * 60;
                case "m":
                    return value * 60;
                case "s":
                    return value;
                default:
                    return 3600;
            }
        }

        return 3600; // Default fallback
    }

    /**
     * Validate payload structure (existing method - unchanged)
     */
    private isValidCustomPayload(
        payload: JwtPayload,
    ): payload is CustomJwtPayload {
        this.logger.debug("Validating JWT payload", {
            email: typeof payload.email,
            id: typeof payload.id,
            name: typeof payload.name,
            status: typeof payload.status,
            statusValue: payload.status,
        });

        if (typeof payload.id !== "string" || !payload.id) {
            this.logger.error("Invalid or missing id field");
            return false;
        }

        if (typeof payload.email !== "string" || !payload.email) {
            this.logger.error("Invalid or missing email field");
            return false;
        }

        if (
            payload.name !== undefined &&
            payload.name !== null &&
            typeof payload.name !== "string"
        ) {
            this.logger.error("Invalid name field type", {
                nameType: typeof payload.name,
                nameValue: payload.name,
            });
            return false;
        }

        if (!payload.status || typeof payload.status !== "string") {
            this.logger.error("Invalid or missing status field", {
                statusType: typeof payload.status,
                statusValue: payload.status,
            });
            return false;
        }

        return true;
    }
}
