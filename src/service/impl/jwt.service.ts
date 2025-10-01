// src/service/jwt.service.ts
import { inject, injectable } from "inversify";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Logger } from "winston";

import { JwtEntity, TokenType } from "@/entity/jwt.entity.js";
import { IJwtTokenRepository } from "@/repository/jwt-token-repository-interface.js";
import { IJwtService } from "@/service/jwt-service.interface.js";
import { KeyStore } from "@/type/class/keystore.js";
import { TYPES } from "@/type/container/types.js";
import { CustomJwtPayload } from "@/type/interface/jwt.interface.js";
import {
    JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS,
    refreshSignOptions,
    signOptions,
    verifyOptions,
} from "@/util/jwt-options.js";

@injectable()
export class JwtService implements IJwtService {
    constructor(
        @inject(TYPES.KeyStore)
        private readonly keyStore: KeyStore,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
        @inject(TYPES.IJwtTokenRepository)
        private readonly jwtTokenRepository: IJwtTokenRepository,
    ) {}

    /**
     * Decode token without verification (existing method - unchanged)
     */
    public decodeToken(token: string): CustomJwtPayload | null {
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
    public async generateAccessToken(
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
            const jwtEntity = new JwtEntity({
                familyId,
                token,
                ttl,
                type: TokenType.ACCESS,
            });
            await this.jwtTokenRepository.save(jwtEntity);

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
    public async generateRefreshToken(
        payload: CustomJwtPayload,
        familyId: string,
    ): Promise<string> {
        try {
            const token = jwt.sign(
                payload,
                this.keyStore.getPrivateKey(),
                refreshSignOptions,
            );

            const ttl = this.extractTtlFromOptions(
                refreshSignOptions.expiresIn,
            );

            const jwtEntity = new JwtEntity({
                familyId,
                token,
                ttl,
                type: TokenType.REFRESH,
            });
            await this.jwtTokenRepository.save(jwtEntity);

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
     * Verify JWT token with Redis validation
     * This method now checks both JWT validity AND Redis storage/blacklist status
     */
    public async verifyToken(token: string): Promise<CustomJwtPayload> {
        try {
            // Check if token exists and is valid in Redis
            const jwtEntity = await this.jwtTokenRepository.findByToken(token);

            if (!jwtEntity?.isValid()) {
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
                await this.jwtTokenRepository.blacklistTokenByValue(token);
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
