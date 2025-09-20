import { inject, injectable } from "inversify";
import { Logger } from "winston";

import { JwtEntity, TokenType } from "@/entity/jwt.entity.js";
import { IJwtTokenRepository } from "@/repository/jwt-token-repository-interface.js";
import { TYPES } from "@/type/container/types.js";
import { JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS } from "@/util/jwt-options.js";

@injectable()
export class JwtEntityService {
    constructor(
        @inject(TYPES.IJwtTokenRepository)
        private readonly jwtTokenRepository: IJwtTokenRepository,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
    ) {}

    // Blacklist a token
    async blacklistToken(token: string): Promise<boolean> {
        try {
            const success =
                await this.jwtTokenRepository.blacklistTokenByValue(token);

            // Simplified logging - only log the action, not multiple messages
            if (success) {
                this.logger.debug(
                    `Token blacklisted: ${token.substring(0, 8)}...`,
                );
            }

            return success;
        } catch (error) {
            this.logger.error("Error blacklisting token", {
                error: error instanceof Error ? error.message : String(error),
                tokenPrefix: token.substring(0, 8),
            });
            return false;
        }
    }

    // Cleanup expired tokens (should be called periodically)
    async cleanupExpiredTokens(): Promise<number> {
        try {
            const deletedCount =
                await this.jwtTokenRepository.deleteExpiredTokens();
            this.logger.info(
                `Cleaned up ${deletedCount.toString()} expired tokens`,
            );
            return deletedCount;
        } catch (error) {
            this.logger.error("Error cleaning up expired tokens:", { error });
            throw error;
        }
    }

    // Create and save a new JWT token
    async createToken(
        token: string,
        ttl: number,
        type: TokenType,
        familyId: string,
    ): Promise<JwtEntity> {
        try {
            const jwtEntity: JwtEntity = new JwtEntity({
                familyId,
                token,
                ttl,
                type,
            });
            await this.jwtTokenRepository.save(jwtEntity);

            // Only log in debug mode to reduce noise
            this.logger.debug(`JWT token created: ${jwtEntity.id}`);
            return jwtEntity;
        } catch (error) {
            this.logger.error("JWT token creation failed", {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new Error("Failed to create JWT token");
        }
    }

    // Delete a token (for logout)
    async deleteToken(token: string): Promise<boolean> {
        try {
            const success = await this.jwtTokenRepository.deleteByToken(token);

            if (success) {
                this.logger.info(`Token deleted successfully`);
            }

            return success;
        } catch (error) {
            this.logger.error("Error deleting token:", { error });
            return false;
        }
    }

    // Get all tokens for a user (if you extend the entity to include userId)
    async getAllTokens(): Promise<JwtEntity[]> {
        try {
            return await this.jwtTokenRepository.getAllTokens();
        } catch (error) {
            this.logger.error("Error getting all tokens:", { error });
            return [];
        }
    }

    // Get token information
    async getTokenInfo(token: string): Promise<JwtEntity | null> {
        try {
            return await this.jwtTokenRepository.findByToken(token);
        } catch (error) {
            this.logger.error("Error getting token info:", { error });
            return null;
        }
    }

    // Check if token is blacklisted
    async isTokenBlacklisted(token: string): Promise<boolean> {
        try {
            return await this.jwtTokenRepository.isTokenBlacklisted(token);
        } catch (error) {
            this.logger.error("Error checking token blacklist status:", {
                error,
            });
            return true; // Default to blacklisted on error for security
        }
    }

    // Refresh token TTL
    async refreshTokenTTL(
        token: string,
        newTtl = JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS,
    ): Promise<boolean> {
        try {
            const jwtEntity: JwtEntity | null =
                await this.jwtTokenRepository.findByToken(token);

            if (!jwtEntity || jwtEntity.isBlacklisted) {
                return false;
            }

            // Create a new token entity with updated TTL
            jwtEntity.ttl = newTtl;
            jwtEntity.modifiedAt = new Date();

            await this.jwtTokenRepository.save(jwtEntity);

            this.logger.info(
                `Token TTL refreshed for token ID: ${jwtEntity.id}`,
            );
            return true;
        } catch (error) {
            this.logger.error("Error refreshing token TTL:", { error });
            return false;
        }
    }

    // Validate if a token is valid (exists, not blacklisted, not expired)
    async validateToken(token: string): Promise<boolean> {
        try {
            const jwtEntity: JwtEntity | null =
                await this.jwtTokenRepository.findByToken(token);

            if (!jwtEntity) {
                return false;
            }

            return jwtEntity.isValid();
        } catch (error) {
            this.logger.error("Error validating token:", { error });
            return false; // Default to invalid on error
        }
    }
}
