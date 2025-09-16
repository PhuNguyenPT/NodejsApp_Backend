import { injectable } from "inversify";

import { redisClient } from "@/config/redis.config.js";
import { JwtEntity } from "@/entity/jwt.entity.js";
import { IJwtTokenRepository } from "@/repository/jwt-token-repository-interface.js";
import logger from "@/util/logger.js";

@injectable()
export class JwtTokenRepository implements IJwtTokenRepository {
    private readonly BLACKLIST_TTL_SECONDS = 60; // 1 minute

    private readonly familyIndexPrefix = "family_index:";
    private readonly keyPrefix = "jwt_entity:";
    private readonly tokenIndexPrefix = "token_index:";

    // Blacklist token by ID
    async blacklistToken(tokenId: string): Promise<boolean> {
        try {
            const jwtEntity: JwtEntity | null = await this.findById(tokenId);

            if (!jwtEntity) {
                return false;
            }

            jwtEntity.blacklist();
            jwtEntity.ttl = this.BLACKLIST_TTL_SECONDS;
            jwtEntity.modifiedAt = new Date();

            const key = this.getTokenKey(jwtEntity.id);
            const tokenIndexKey = this.getTokenIndexKey(jwtEntity.token);
            const familyIndexKey = this.getFamilyIndexKey(jwtEntity.familyId);

            // Use pipeline for atomic operations
            const pipeline = redisClient.multi();

            // Update the token data with blacklist status and short TTL
            pipeline.hSet(key, jwtEntity.toRedisObject());
            pipeline.expire(key, this.BLACKLIST_TTL_SECONDS);

            // Update token index with short TTL
            pipeline.expire(tokenIndexKey, this.BLACKLIST_TTL_SECONDS);

            // Remove the token ID from the family set since it's blacklisted
            pipeline.sRem(familyIndexKey, jwtEntity.id);

            await pipeline.exec();

            logger.info(
                `Token blacklisted and removed from family: ${tokenId}`,
            );
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
            const deletedTokens = await this.deleteExpiredTokens();
            const cleanedFamilies = await this.cleanupExpiredFamilies();

            logger.info("JWT cleanup completed", {
                cleanedFamilies,
                deletedTokens,
            });
        } catch (error) {
            logger.error("Error during JWT cleanup:", error);
        }
    }

    async cleanupExpiredFamilies(): Promise<number> {
        try {
            let cursor = 0;
            let cleanedFamilies = 0;
            const scanOptions = {
                COUNT: 50,
                MATCH: `${this.familyIndexPrefix}*`,
            };

            do {
                const reply = await redisClient.scan(cursor, scanOptions);
                cursor = reply.cursor;
                const familyKeys = reply.keys;

                for (const familyKey of familyKeys) {
                    const tokenIds = await redisClient.sMembers(familyKey);
                    let hasValidTokens = false;
                    const tokensToCleanup: JwtEntity[] = [];

                    // Check if any tokens in the family are still valid
                    for (const tokenId of tokenIds) {
                        const jwtEntity = await this.findById(tokenId);
                        if (jwtEntity) {
                            tokensToCleanup.push(jwtEntity);
                            if (jwtEntity.isValid()) {
                                hasValidTokens = true;
                                break; // Early exit if we find a valid token
                            }
                        }
                    }

                    // If no valid tokens, clean up the family
                    if (!hasValidTokens && tokensToCleanup.length > 0) {
                        const pipeline = redisClient.multi();

                        // Use the already fetched tokens instead of fetching again
                        for (const jwtEntity of tokensToCleanup) {
                            const key = this.getTokenKey(jwtEntity.id);
                            const tokenIndexKey = this.getTokenIndexKey(
                                jwtEntity.token,
                            );
                            pipeline.del(key);
                            pipeline.del(tokenIndexKey);
                        }

                        pipeline.del(familyKey);
                        await pipeline.exec();

                        cleanedFamilies++;
                        logger.debug(
                            `Cleaned up expired family: ${familyKey} (${tokensToCleanup.length.toString()} tokens)`,
                        );
                    }
                }
            } while (cursor !== 0);

            if (cleanedFamilies > 0) {
                logger.info(
                    `Cleaned up ${cleanedFamilies.toString()} expired token families`,
                );
            }

            return cleanedFamilies;
        } catch (error) {
            logger.error("Error cleaning up expired families:", error);
            return 0;
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
            const familyIndexKey = this.getFamilyIndexKey(jwtEntity.familyId);

            // Use pipeline for atomic operations
            const pipeline = redisClient.multi();
            pipeline.del(key);
            pipeline.del(tokenIndexKey);
            // Also remove from family set
            pipeline.sRem(familyIndexKey, jwtEntity.id);

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
            let cursor = 0;
            let deletedCount = 0;
            const scanOptions = { COUNT: 100, MATCH: `${this.keyPrefix}*` };

            do {
                const reply = await redisClient.scan(cursor, scanOptions);
                cursor = reply.cursor;
                const keys = reply.keys;

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
            } while (cursor !== 0);

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
            logger.error("Error finding JWT token by value:", error);
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

    async invalidateFamily(familyId: string): Promise<void> {
        try {
            const familyIndexKey = this.getFamilyIndexKey(familyId);
            const tokenIds = await redisClient.sMembers(familyIndexKey);

            if (tokenIds.length === 0) {
                return;
            }

            // Fetch all tokens first, then pipeline the updates
            const jwtEntities: JwtEntity[] = [];
            for (const tokenId of tokenIds) {
                const jwtEntity = await this.findById(tokenId);
                if (jwtEntity && !jwtEntity.isBlacklisted) {
                    jwtEntity.blacklist();
                    jwtEntity.ttl = this.BLACKLIST_TTL_SECONDS;
                    jwtEntities.push(jwtEntity);
                }
            }

            if (jwtEntities.length === 0) {
                // All tokens already blacklisted, just clean up the family set
                await redisClient.del(familyIndexKey);
                return;
            }

            // Now pipeline all the updates
            const pipeline = redisClient.multi();
            for (const jwtEntity of jwtEntities) {
                const key = this.getTokenKey(jwtEntity.id);
                pipeline.hSet(key, jwtEntity.toRedisObject());
                pipeline.expire(key, this.BLACKLIST_TTL_SECONDS);

                // Also update the token index
                const tokenIndexKey = this.getTokenIndexKey(jwtEntity.token);
                pipeline.expire(tokenIndexKey, this.BLACKLIST_TTL_SECONDS);
            }

            // Delete the family set itself
            pipeline.del(familyIndexKey);
            await pipeline.exec();

            logger.warn(
                `Invalidated token family: ${familyId} (${jwtEntities.length.toString()} tokens)`,
            );
        } catch (error) {
            logger.error(`Error invalidating token family ${familyId}:`, error);
            throw error;
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
            const familyIndexKey = this.getFamilyIndexKey(jwtEntity.familyId);

            const redisData = jwtEntity.toRedisObject();

            // Use pipeline for atomic operations
            const pipeline = redisClient.multi();

            // Store the token data with TTL
            pipeline.hSet(key, redisData);
            pipeline.expire(key, jwtEntity.ttl);

            // Create index for token lookup
            pipeline.set(tokenIndexKey, jwtEntity.id);
            pipeline.expire(tokenIndexKey, jwtEntity.ttl);

            // Add the token's ID to the family set
            pipeline.sAdd(familyIndexKey, jwtEntity.id);
            pipeline.expire(familyIndexKey, jwtEntity.ttl);

            await pipeline.exec();

            logger.debug(`JWT token saved with ID: ${jwtEntity.id}`);
        } catch (error) {
            logger.error("Error saving JWT token:", error);
            throw new Error("Failed to save JWT token");
        }
    }

    // Helper methods
    private getFamilyIndexKey(familyId: string): string {
        return `${this.familyIndexPrefix}${familyId}`;
    }

    private getTokenIndexKey(token: string): string {
        return `${this.tokenIndexPrefix}${token}`;
    }

    private getTokenKey(id: string): string {
        return `${this.keyPrefix}${id}`;
    }
}
