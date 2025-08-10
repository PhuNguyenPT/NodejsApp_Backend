import { injectable } from "inversify";

import { redisClient } from "@/config/redis";
import { JwtEntity } from "@/entity/jwt.entity";
import logger from "@/util/logger";

import { IJwtTokenRepository } from "../jwt.token.repository.interface";

@injectable()
export class JwtTokenRepository implements IJwtTokenRepository {
    private readonly BLACKLIST_TTL_SECONDS = 60; // 1 minute

    private readonly keyPrefix = "jwt_token:";
    private readonly tokenIndexPrefix = "token_index:";

    // Blacklist token by ID
    async blacklistToken(tokenId: string): Promise<boolean> {
        try {
            const jwtEntity: JwtEntity | null = await this.findById(tokenId);

            if (!jwtEntity) {
                return false;
            }

            jwtEntity.blacklist();
            jwtEntity.ttl = this.BLACKLIST_TTL_SECONDS; // Set TTL for blacklisted token
            jwtEntity.modifiedAt = new Date();

            await this.save(jwtEntity);

            logger.info(`Token blacklisted: ${tokenId}`);
            return true;
        } catch (error) {
            logger.error(`Error blacklisting token ${tokenId}:`, error);
            return false;
        }
    }

    // Blacklist token by value
    async blacklistTokenByValue(token: string): Promise<boolean> {
        try {
            const jwtEntity: JwtEntity | null = await this.findByToken(token);

            if (!jwtEntity) {
                return false;
            }

            return await this.blacklistToken(jwtEntity.id);
        } catch (error) {
            logger.error("Error blacklisting token by value:", error);
            return false;
        }
    }

    // Cleanup expired tokens periodically
    async cleanup(): Promise<void> {
        try {
            await this.deleteExpiredTokens();
            logger.info("JWT token cleanup completed");
        } catch (error) {
            logger.error("Error during JWT token cleanup:", error);
        }
    }

    // Delete token by ID
    async deleteById(id: string): Promise<boolean> {
        try {
            const jwtEntity: JwtEntity | null = await this.findById(id);

            if (!jwtEntity) {
                return false;
            }

            const key = this.getTokenKey(id);
            const tokenIndexKey = this.getTokenIndexKey(jwtEntity.token);

            // Use pipeline for atomic operations
            const pipeline = redisClient.multi();
            pipeline.del(key);
            pipeline.del(tokenIndexKey);

            const results = await pipeline.exec();
            const deleted = results[0]?.[1] === 1;

            if (deleted) {
                logger.debug(`JWT token deleted: ${id}`);
            }

            return deleted;
        } catch (error) {
            logger.error(`Error deleting token ${id}:`, error);
            return false;
        }
    }

    // Delete token by value
    async deleteByToken(token: string): Promise<boolean> {
        try {
            const jwtEntity: JwtEntity | null = await this.findByToken(token);

            if (!jwtEntity) {
                return false;
            }

            return await this.deleteById(jwtEntity.id);
        } catch (error) {
            logger.error("Error deleting token by value:", error);
            return false;
        }
    }

    // Delete expired tokens (cleanup job)
    async deleteExpiredTokens(): Promise<number> {
        try {
            const keys = await redisClient.keys(`${this.keyPrefix}*`);
            let deletedCount = 0;

            for (const key of keys) {
                const data = await redisClient.hGetAll(key);

                if (Object.keys(data).length > 0) {
                    const jwtEntity: JwtEntity =
                        JwtEntity.fromRedisObject(data);

                    if (jwtEntity.isExpired()) {
                        const success = await this.deleteById(jwtEntity.id);
                        if (success) {
                            deletedCount++;
                        }
                    }
                }
            }

            logger.info(
                `Deleted ${deletedCount.toString()} expired JWT tokens`,
            );
            return deletedCount;
        } catch (error) {
            logger.error("Error deleting expired tokens:", error);
            throw new Error("Failed to delete expired tokens");
        }
    }

    // Find token by ID
    async findById(id: string): Promise<JwtEntity | null> {
        try {
            const key = this.getTokenKey(id);
            const exists = await redisClient.exists(key);

            if (!exists) {
                return null;
            }

            const data = await redisClient.hGetAll(key);

            if (Object.keys(data).length === 0) {
                return null;
            }

            return JwtEntity.fromRedisObject(data);
        } catch (error) {
            logger.error(`Error finding JWT token by ID ${id}:`, error);
            throw new Error("Failed to find JWT token by ID");
        }
    }

    // Find token by token value
    async findByToken(token: string): Promise<JwtEntity | null> {
        try {
            const tokenIndexKey = this.getTokenIndexKey(token);
            const tokenId = await redisClient.get(tokenIndexKey);

            if (!tokenId) {
                return null;
            }

            return await this.findById(tokenId);
        } catch (error) {
            logger.error(`Error finding JWT token by value:`, error);
            throw new Error("Failed to find JWT token by value");
        }
    }

    // Get all tokens (for admin/debugging purposes)
    async getAllTokens(): Promise<JwtEntity[]> {
        try {
            const keys = await redisClient.keys(`${this.keyPrefix}*`);
            const tokens: JwtEntity[] = [];

            for (const key of keys) {
                const data = await redisClient.hGetAll(key);

                if (Object.keys(data).length > 0) {
                    tokens.push(JwtEntity.fromRedisObject(data));
                }
            }

            return tokens;
        } catch (error) {
            logger.error("Error getting all tokens:", error);
            throw new Error("Failed to get all tokens");
        }
    }

    // Check if token is blacklisted
    async isTokenBlacklisted(token: string): Promise<boolean> {
        try {
            const jwtEntity = await this.findByToken(token);

            if (!jwtEntity) {
                return false; // Token doesn't exist, consider as not blacklisted
            }

            return jwtEntity.isBlacklisted;
        } catch (error) {
            logger.error("Error checking if token is blacklisted:", error);
            return true; // Default to blacklisted on error for security
        }
    }

    // Save JWT token entity to Redis
    async save(jwtEntity: JwtEntity): Promise<void> {
        try {
            const key = this.getTokenKey(jwtEntity.id);
            const tokenIndexKey = this.getTokenIndexKey(jwtEntity.token);
            const redisData = jwtEntity.toRedisObject();

            // Use pipeline for atomic operations
            const pipeline = redisClient.multi();

            // Store the token data with TTL
            pipeline.hSet(key, redisData);
            pipeline.expire(key, jwtEntity.ttl);

            // Create index for token lookup
            pipeline.set(tokenIndexKey, jwtEntity.id);
            pipeline.expire(tokenIndexKey, jwtEntity.ttl);

            await pipeline.exec();

            logger.debug(`JWT token saved with ID: ${jwtEntity.id}`);
        } catch (error) {
            logger.error("Error saving JWT token:", error);
            throw new Error("Failed to save JWT token");
        }
    }

    private getTokenIndexKey(token: string): string {
        return `${this.tokenIndexPrefix}${token}`;
    }

    // Helper methods
    private getTokenKey(id: string): string {
        return `${this.keyPrefix}${id}`;
    }
}
