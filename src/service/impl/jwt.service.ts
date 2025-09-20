// src/service/jwt.service.ts
import { inject, injectable } from "inversify";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Logger } from "winston";

import { TokenType } from "@/entity/jwt.entity.js";
import { KeyStore } from "@/type/class/keystore.js";
import { TYPES } from "@/type/container/types.js";
import { CustomJwtPayload } from "@/type/interface/jwt.interface.js";
import {
    JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS,
    JWT_REFRESH_TOKEN_EXPIRATION_SECONDS,
    refreshSignOptions,
    signOptions,
    verifyOptions,
} from "@/util/jwt-options.js";

import { JwtEntityService } from "./jwt-entity.service.js";

@injectable()
export class JWTService {
    constructor(
        @inject(TYPES.KeyStore)
        private keyStore: KeyStore,
        @inject(TYPES.Logger)
        private logger: Logger,
        @inject(TYPES.JwtEntityService)
        private jwtEntityService: JwtEntityService,
    ) {}

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
    async generateAccessToken(
        payload: CustomJwtPayload,
        familyId: string,
    ): Promise<string> {
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
                familyId,
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
    async generateRefreshToken(
        payload: CustomJwtPayload,
        familyId: string,
    ): Promise<string> {
        try {
            const token = jwt.sign(
                payload,
                this.keyStore.getPrivateKey(),
                refreshSignOptions,
            );

            await this.jwtEntityService.createToken(
                token,
                JWT_REFRESH_TOKEN_EXPIRATION_SECONDS,
                TokenType.REFRESH,
                familyId,
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
            return JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS; // Default 1 hour
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

        return JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS; // Default fallback
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
            statusValue: payload.status as unknown,
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
                nameValue: payload.name as unknown,
            });
            return false;
        }

        if (!payload.status || typeof payload.status !== "string") {
            this.logger.error("Invalid or missing status field", {
                statusType: typeof payload.status,
                statusValue: payload.status as unknown,
            });
            return false;
        }

        return true;
    }
}
