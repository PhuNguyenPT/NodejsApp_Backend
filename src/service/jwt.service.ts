// src/service/jwt.service.ts
import { inject, injectable } from "inversify";
import jwt, { JwtPayload } from "jsonwebtoken";

import { KeyStore } from "@/type/class/keystore.js";
import { TYPES } from "@/type/container/types.js";
import { CustomJwtPayload } from "@/type/interface/jwt";
import { ILogger } from "@/type/interface/logger.js";
import { signOptions, verifyOptions } from "@/util/jwt.options.js";

@injectable()
export class JWTService {
    constructor(
        @inject(TYPES.KeyStore)
        private keyStore: KeyStore,
        @inject(TYPES.Logger)
        private logger: ILogger,
    ) {}

    /**
     * Decode token without verification (useful for getting payload info)
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
     * Generate JWT access token for user
     */
    generateAccessToken(payload: CustomJwtPayload): string {
        return jwt.sign(payload, this.keyStore.getPrivateKey(), signOptions);
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(payload: CustomJwtPayload): string {
        return jwt.sign(payload, this.keyStore.getPrivateKey(), signOptions);
    }

    /**
     * Check if token is expired without throwing
     */
    isTokenExpired(token: string): boolean {
        try {
            this.verifyToken(token);
            return false;
        } catch (error) {
            return (
                error instanceof Error && error.message === "Token has expired"
            );
        }
    }

    /**
     * Verify JWT token manually (for refresh tokens)
     * Returns the decoded JWT payload
     */
    verifyToken(token: string): CustomJwtPayload {
        try {
            const decoded = jwt.verify(
                token,
                this.keyStore.getPublicKey(),
                verifyOptions,
            );

            // jwt.verify can return string | JwtPayload, we need to handle both cases
            if (typeof decoded === "string") {
                this.logger.error("Invalid token format", {
                    decoded: decoded,
                });

                throw new Error("Invalid token format");
            }

            // Validate that the decoded payload has our custom properties
            if (!this.isValidCustomPayload(decoded)) {
                this.logger.error("Invalid token payload structure", {
                    payload: decoded,
                });
                throw new Error("Invalid token payload structure");
            }

            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error("Token has expired");
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("Invalid token");
            } else if (error instanceof Error) {
                throw error; // Re-throw our custom errors
            } else {
                throw new Error("Token verification failed");
            }
        }
    }

    /**
     * Validate that the decoded payload matches our CustomJwtPayload structure
     */
    private isValidCustomPayload(
        payload: JwtPayload,
    ): payload is CustomJwtPayload {
        // Debug log to see what we're validating
        this.logger.debug("Validating JWT payload", {
            email: typeof payload.email,
            id: typeof payload.id,
            name: typeof payload.name,
            status: typeof payload.status,
            statusValue: payload.status,
        });

        // Check required fields
        if (typeof payload.id !== "string" || !payload.id) {
            this.logger.error("Invalid or missing id field");
            return false;
        }

        if (typeof payload.email !== "string" || !payload.email) {
            this.logger.error("Invalid or missing email field");
            return false;
        }

        // Name can be undefined, null, or string
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

        // Status validation - just check if it exists and is a string
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
