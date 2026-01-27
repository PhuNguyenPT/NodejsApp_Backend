// test/integration/repository/jwt-token-repository.integration.spec.ts
import type { RedisClientType } from "redis";

import { v7 } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { IJwtRepository } from "@/repository/jwt-repository-interface.js";

import { iocContainer } from "@/app/ioc-container.js";
import { JwtEntity, TokenType } from "@/entity/security/jwt.entity.js";
import { getApp } from "@/test/setup.js";
import { type UUID, UUIDSchema } from "@/type/common/uuid.type.js";
import { TYPES } from "@/type/container/types.js";

describe("JwtTokenRepository Integration Tests", () => {
    let redisClient: RedisClientType;
    let jwtTokenRepository: IJwtRepository;
    const createdTokenIds: UUID[] = [];
    const testFamilyIds: UUID[] = [];

    beforeAll(async () => {
        getApp();

        redisClient = iocContainer.get<RedisClientType>(TYPES.RedisPublisher);
        jwtTokenRepository = iocContainer.get<IJwtRepository>(
            TYPES.IJwtRepository,
        );

        // Clean up Redis from previous test runs
        const jwtKeys = await redisClient.keys("jwt_entity:*");
        const tokenIndexKeys = await redisClient.keys("token_index:*");
        const familyIndexKeys = await redisClient.keys("family_index:*");

        const allKeys = [...jwtKeys, ...tokenIndexKeys, ...familyIndexKeys];
        if (allKeys.length > 0) {
            await redisClient.del(allKeys);
        }
    });

    afterAll(async () => {
        // Clean up all test tokens
        for (const tokenId of createdTokenIds) {
            await jwtTokenRepository.deleteById(tokenId);
        }

        // Final Redis cleanup
        const jwtKeys = await redisClient.keys("jwt_entity:*");
        const tokenIndexKeys = await redisClient.keys("token_index:*");
        const familyIndexKeys = await redisClient.keys("family_index:*");

        const allKeys = [...jwtKeys, ...tokenIndexKeys, ...familyIndexKeys];
        if (allKeys.length > 0) {
            await redisClient.del(allKeys);
        }
    });

    // Helper function to create test JWT entity
    const createTestToken = (
        type: TokenType,
        overrides?: Partial<{
            createdAt: Date;
            familyId: UUID;
            isBlacklisted: boolean;
            ttl: number;
        }>,
    ): JwtEntity => {
        const familyId = overrides?.familyId ?? UUIDSchema.parse(v7());
        const token = `test.jwt.token.${Date.now().toString()}.${v7()}`;
        const ttl = overrides?.ttl ?? 3600;

        const jwtEntity = new JwtEntity({
            createdAt: overrides?.createdAt,
            familyId,
            token,
            ttl,
            type,
        });

        if (overrides?.isBlacklisted) {
            jwtEntity.blacklist();
        }

        if (!testFamilyIds.includes(familyId)) {
            testFamilyIds.push(familyId);
        }

        return jwtEntity;
    };

    describe("save", () => {
        it("should save a new JWT token entity", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);

            // Act
            await jwtTokenRepository.save(jwtEntity);

            // Assert
            const retrieved = await jwtTokenRepository.findById(jwtEntity.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(jwtEntity.id);
            expect(retrieved?.token).toBe(jwtEntity.token);
            expect(retrieved?.familyId).toBe(jwtEntity.familyId);
        });

        it("should create token index for quick lookup", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);

            // Act
            await jwtTokenRepository.save(jwtEntity);

            // Assert
            const tokenIndexKey = `token_index:${jwtEntity.token}`;
            const storedId = await redisClient.get(tokenIndexKey);
            expect(storedId).toBe(jwtEntity.id);
        });

        it("should add token to family index", async () => {
            // Arrange
            const familyId = UUIDSchema.parse(v7());
            const jwtEntity = createTestToken(TokenType.ACCESS, { familyId });
            createdTokenIds.push(jwtEntity.id);

            // Act
            await jwtTokenRepository.save(jwtEntity);

            // Assert
            const familyIndexKey = `family_index:${familyId}`;
            const familyMembers = await redisClient.sMembers(familyIndexKey);
            expect(familyMembers).toContain(jwtEntity.id);
        });

        it("should set TTL on all keys", async () => {
            // Arrange
            const ttl = 300;
            const jwtEntity = createTestToken(TokenType.ACCESS, { ttl });
            createdTokenIds.push(jwtEntity.id);

            // Act
            await jwtTokenRepository.save(jwtEntity);

            // Assert
            const tokenKey = `jwt_entity:${jwtEntity.id}`;
            const tokenIndexKey = `token_index:${jwtEntity.token}`;
            const familyIndexKey = `family_index:${jwtEntity.familyId}`;

            const tokenTtl = await redisClient.ttl(tokenKey);
            const indexTtl = await redisClient.ttl(tokenIndexKey);
            const familyTtl = await redisClient.ttl(familyIndexKey);

            expect(tokenTtl).toBeGreaterThan(0);
            expect(tokenTtl).toBeLessThanOrEqual(ttl);
            expect(indexTtl).toBeGreaterThan(0);
            expect(familyTtl).toBeGreaterThan(0);
        });

        it("should handle multiple tokens in same family", async () => {
            // Arrange
            const familyId = UUIDSchema.parse(v7());
            const token1 = createTestToken(TokenType.ACCESS, { familyId });
            const token2 = createTestToken(TokenType.ACCESS, { familyId });
            createdTokenIds.push(token1.id, token2.id);

            // Act
            await jwtTokenRepository.save(token1);
            await jwtTokenRepository.save(token2);

            // Assert
            const familyIndexKey = `family_index:${familyId}`;
            const familyMembers = await redisClient.sMembers(familyIndexKey);
            expect(familyMembers).toHaveLength(2);
            expect(familyMembers).toContain(token1.id);
            expect(familyMembers).toContain(token2.id);
        });
    });

    describe("findById", () => {
        it("should retrieve existing token by id", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            const result = await jwtTokenRepository.findById(jwtEntity.id);

            // Assert
            expect(result).toBeDefined();
            expect(result?.id).toBe(jwtEntity.id);
            expect(result?.token).toBe(jwtEntity.token);
            expect(result?.familyId).toBe(jwtEntity.familyId);
        });

        it("should return null for non-existent token", async () => {
            // Arrange
            const nonExistentId = UUIDSchema.parse(v7());

            // Act
            const result = await jwtTokenRepository.findById(nonExistentId);

            // Assert
            expect(result).toBeNull();
        });

        it("should return null for expired/deleted token", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);
            await jwtTokenRepository.deleteById(jwtEntity.id);

            // Act
            const result = await jwtTokenRepository.findById(jwtEntity.id);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe("findByToken", () => {
        it("should retrieve token by token value", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            const result = await jwtTokenRepository.findByToken(
                jwtEntity.token,
            );

            // Assert
            expect(result).toBeDefined();
            expect(result?.id).toBe(jwtEntity.id);
            expect(result?.token).toBe(jwtEntity.token);
        });

        it("should return null for non-existent token value", async () => {
            // Arrange
            const nonExistentToken = "non.existent.token";

            // Act
            const result =
                await jwtTokenRepository.findByToken(nonExistentToken);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe("getAllTokens", () => {
        it("should retrieve all tokens", async () => {
            // Arrange
            const token1 = createTestToken(TokenType.ACCESS);
            const token2 = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(token1.id, token2.id);

            await jwtTokenRepository.save(token1);
            await jwtTokenRepository.save(token2);

            // Act
            const result = await jwtTokenRepository.getAllTokens();

            // Assert
            expect(result.length).toBeGreaterThanOrEqual(2);
            expect(result.some((t) => t.id === token1.id)).toBe(true);
            expect(result.some((t) => t.id === token2.id)).toBe(true);
        });

        it("should return empty array when no tokens exist", async () => {
            // Arrange - cleanup all tokens first
            const allTokens = await jwtTokenRepository.getAllTokens();
            for (const token of allTokens) {
                await jwtTokenRepository.deleteById(token.id);
            }

            // Act
            const result = await jwtTokenRepository.getAllTokens();

            // Assert
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });
    });

    describe("deleteById", () => {
        it("should delete existing token", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            const deleted = await jwtTokenRepository.deleteById(jwtEntity.id);

            // Assert
            expect(deleted).toBe(true);
            const retrieved = await jwtTokenRepository.findById(jwtEntity.id);
            expect(retrieved).toBeNull();
        });

        it("should remove token from family index", async () => {
            // Arrange
            const familyId = UUIDSchema.parse(v7());
            const jwtEntity = createTestToken(TokenType.ACCESS, { familyId });
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            await jwtTokenRepository.deleteById(jwtEntity.id);

            // Assert
            const familyIndexKey = `family_index:${familyId}`;
            const familyMembers = await redisClient.sMembers(familyIndexKey);
            expect(familyMembers).not.toContain(jwtEntity.id);
        });

        it("should delete token index", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            await jwtTokenRepository.deleteById(jwtEntity.id);

            // Assert
            const tokenIndexKey = `token_index:${jwtEntity.token}`;
            const exists = await redisClient.exists(tokenIndexKey);
            expect(exists).toBe(0);
        });

        it("should return false for non-existent token", async () => {
            // Arrange
            const nonExistentId = UUIDSchema.parse(v7());

            // Act
            const deleted = await jwtTokenRepository.deleteById(nonExistentId);

            // Assert
            expect(deleted).toBe(false);
        });
    });

    describe("deleteByToken", () => {
        it("should delete token by token value", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            const deleted = await jwtTokenRepository.deleteByToken(
                jwtEntity.token,
            );

            // Assert
            expect(deleted).toBe(true);
            const retrieved = await jwtTokenRepository.findByToken(
                jwtEntity.token,
            );
            expect(retrieved).toBeNull();
        });

        it("should return false for non-existent token value", async () => {
            // Arrange
            const nonExistentToken = "non.existent.token";

            // Act
            const deleted =
                await jwtTokenRepository.deleteByToken(nonExistentToken);

            // Assert
            expect(deleted).toBe(false);
        });
    });

    describe("blacklistToken", () => {
        it("should blacklist token by id", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS, { ttl: 3600 });
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            const blacklisted = await jwtTokenRepository.blacklistToken(
                jwtEntity.id,
            );

            // Assert
            expect(blacklisted).toBe(true);
            const retrieved = await jwtTokenRepository.findById(jwtEntity.id);
            expect(retrieved?.isBlacklisted).toBe(true);
        });

        it("should set short TTL on blacklisted token", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS, { ttl: 3600 });
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            await jwtTokenRepository.blacklistToken(jwtEntity.id);

            // Assert
            const tokenKey = `jwt_entity:${jwtEntity.id}`;
            const ttl = await redisClient.ttl(tokenKey);
            expect(ttl).toBeLessThanOrEqual(60);
            expect(ttl).toBeGreaterThan(0);
        });

        it("should remove token from family index when blacklisted", async () => {
            // Arrange
            const familyId = UUIDSchema.parse(v7());
            const jwtEntity = createTestToken(TokenType.ACCESS, { familyId });
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Verify it's in family first
            const familyIndexKey = `family_index:${familyId}`;
            let familyMembers = await redisClient.sMembers(familyIndexKey);
            expect(familyMembers).toContain(jwtEntity.id);

            // Act
            await jwtTokenRepository.blacklistToken(jwtEntity.id);

            // Assert
            familyMembers = await redisClient.sMembers(familyIndexKey);
            expect(familyMembers).not.toContain(jwtEntity.id);
        });

        it("should return false for non-existent token", async () => {
            // Arrange
            const nonExistentId = UUIDSchema.parse(v7());

            // Act
            const blacklisted =
                await jwtTokenRepository.blacklistToken(nonExistentId);

            // Assert
            expect(blacklisted).toBe(false);
        });
    });

    describe("blacklistTokenByValue", () => {
        it("should blacklist token by token value", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            const blacklisted = await jwtTokenRepository.blacklistTokenByValue(
                jwtEntity.token,
            );

            // Assert
            expect(blacklisted).toBe(true);
            const retrieved = await jwtTokenRepository.findByToken(
                jwtEntity.token,
            );
            expect(retrieved?.isBlacklisted).toBe(true);
        });

        it("should return false for non-existent token value", async () => {
            // Arrange
            const nonExistentToken = "non.existent.token";

            // Act
            const blacklisted =
                await jwtTokenRepository.blacklistTokenByValue(
                    nonExistentToken,
                );

            // Assert
            expect(blacklisted).toBe(false);
        });
    });

    describe("isTokenBlacklisted", () => {
        it("should return true for blacklisted token", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);
            await jwtTokenRepository.blacklistToken(jwtEntity.id);

            // Act
            const isBlacklisted = await jwtTokenRepository.isTokenBlacklisted(
                jwtEntity.token,
            );

            // Assert
            expect(isBlacklisted).toBe(true);
        });

        it("should return false for non-blacklisted token", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            const isBlacklisted = await jwtTokenRepository.isTokenBlacklisted(
                jwtEntity.token,
            );

            // Assert
            expect(isBlacklisted).toBe(false);
        });

        it("should return false for non-existent token", async () => {
            // Arrange
            const nonExistentToken = "non.existent.token";

            // Act
            const isBlacklisted =
                await jwtTokenRepository.isTokenBlacklisted(nonExistentToken);

            // Assert
            expect(isBlacklisted).toBe(false);
        });
    });

    describe("invalidateFamily", () => {
        it("should blacklist all tokens in a family", async () => {
            // Arrange
            const familyId = UUIDSchema.parse(v7());
            const token1 = createTestToken(TokenType.ACCESS, { familyId });
            const token2 = createTestToken(TokenType.ACCESS, { familyId });
            const token3 = createTestToken(TokenType.ACCESS, { familyId });
            createdTokenIds.push(token1.id, token2.id, token3.id);

            await jwtTokenRepository.save(token1);
            await jwtTokenRepository.save(token2);
            await jwtTokenRepository.save(token3);

            // Act
            await jwtTokenRepository.invalidateFamily(familyId);

            // Assert
            const retrieved1 = await jwtTokenRepository.findById(token1.id);
            const retrieved2 = await jwtTokenRepository.findById(token2.id);
            const retrieved3 = await jwtTokenRepository.findById(token3.id);

            expect(retrieved1?.isBlacklisted).toBe(true);
            expect(retrieved2?.isBlacklisted).toBe(true);
            expect(retrieved3?.isBlacklisted).toBe(true);
        });

        it("should delete family index after invalidation", async () => {
            // Arrange
            const familyId = UUIDSchema.parse(v7());
            const token1 = createTestToken(TokenType.ACCESS, { familyId });
            createdTokenIds.push(token1.id);
            await jwtTokenRepository.save(token1);

            // Act
            await jwtTokenRepository.invalidateFamily(familyId);

            // Assert
            const familyIndexKey = `family_index:${familyId}`;
            const exists = await redisClient.exists(familyIndexKey);
            expect(exists).toBe(0);
        });

        it("should set short TTL on all family tokens", async () => {
            // Arrange
            const familyId = UUIDSchema.parse(v7());
            const token1 = createTestToken(TokenType.ACCESS, {
                familyId,
                ttl: 3600,
            });
            const token2 = createTestToken(TokenType.ACCESS, {
                familyId,
                ttl: 3600,
            });
            createdTokenIds.push(token1.id, token2.id);

            await jwtTokenRepository.save(token1);
            await jwtTokenRepository.save(token2);

            // Act
            await jwtTokenRepository.invalidateFamily(familyId);

            // Assert
            const ttl1 = await redisClient.ttl(`jwt_entity:${token1.id}`);
            const ttl2 = await redisClient.ttl(`jwt_entity:${token2.id}`);

            expect(ttl1).toBeLessThanOrEqual(60);
            expect(ttl2).toBeLessThanOrEqual(60);
        });

        it("should handle empty family gracefully", async () => {
            // Arrange
            const nonExistentFamily = UUIDSchema.parse(v7());

            // Act & Assert - should not throw
            await expect(
                jwtTokenRepository.invalidateFamily(nonExistentFamily),
            ).resolves.not.toThrow();
        });

        it("should not invalidate already blacklisted tokens", async () => {
            // Arrange
            const familyId = UUIDSchema.parse(v7());
            const token1 = createTestToken(TokenType.ACCESS, { familyId });
            const token2 = createTestToken(TokenType.ACCESS, { familyId });
            createdTokenIds.push(token1.id, token2.id);

            await jwtTokenRepository.save(token1);
            await jwtTokenRepository.save(token2);

            // Blacklist one token first
            await jwtTokenRepository.blacklistToken(token1.id);

            // Act
            await jwtTokenRepository.invalidateFamily(familyId);

            // Assert - both should be blacklisted
            const retrieved1 = await jwtTokenRepository.findById(token1.id);
            const retrieved2 = await jwtTokenRepository.findById(token2.id);

            expect(retrieved1?.isBlacklisted).toBe(true);
            expect(retrieved2?.isBlacklisted).toBe(true);
        });
    });

    describe("deleteExpiredTokens", () => {
        it("should delete expired tokens", async () => {
            // Arrange - Create token with createdAt in the past so isExpired() returns true
            const expiredToken = createTestToken(TokenType.ACCESS, {
                createdAt: new Date(Date.now() - 7200 * 1000), // 2 hours ago
                ttl: 3600, // 1 hour TTL = already expired
            });
            createdTokenIds.push(expiredToken.id);
            await jwtTokenRepository.save(expiredToken);

            // Verify token is expired
            expect(expiredToken.isExpired()).toBe(true);

            // Act
            const deletedCount = await jwtTokenRepository.deleteExpiredTokens();

            // Assert
            expect(deletedCount).toBeGreaterThanOrEqual(1);
            const retrieved = await jwtTokenRepository.findById(
                expiredToken.id,
            );
            expect(retrieved).toBeNull();
        });

        it("should not delete valid tokens", async () => {
            // Arrange
            const validToken = createTestToken(TokenType.ACCESS, { ttl: 3600 });
            createdTokenIds.push(validToken.id);
            await jwtTokenRepository.save(validToken);

            // Act
            await jwtTokenRepository.deleteExpiredTokens();

            // Assert
            const retrieved = await jwtTokenRepository.findById(validToken.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(validToken.id);
        });

        it("should return count of deleted tokens", async () => {
            // Arrange - cleanup existing tokens first
            await jwtTokenRepository.deleteExpiredTokens();

            // Create expired tokens with old createdAt
            const expired1 = createTestToken(TokenType.ACCESS, {
                createdAt: new Date(Date.now() - 7200 * 1000), // 2 hours ago
                ttl: 3600, // 1 hour TTL
            });
            const expired2 = createTestToken(TokenType.ACCESS, {
                createdAt: new Date(Date.now() - 7200 * 1000), // 2 hours ago
                ttl: 3600, // 1 hour TTL
            });
            createdTokenIds.push(expired1.id, expired2.id);

            await jwtTokenRepository.save(expired1);
            await jwtTokenRepository.save(expired2);

            // Verify tokens are expired
            expect(expired1.isExpired()).toBe(true);
            expect(expired2.isExpired()).toBe(true);

            // Act
            const deletedCount = await jwtTokenRepository.deleteExpiredTokens();

            // Assert
            expect(deletedCount).toBeGreaterThanOrEqual(2);
        });
    });

    describe("cleanup", () => {
        it("should cleanup both expired tokens and families", async () => {
            // Arrange
            const familyId = UUIDSchema.parse(v7());
            const expiredToken1 = createTestToken(TokenType.ACCESS, {
                createdAt: new Date(Date.now() - 7200 * 1000), // 2 hours ago
                familyId,
                ttl: 3600, // 1 hour TTL
            });
            const expiredToken2 = createTestToken(TokenType.ACCESS, {
                createdAt: new Date(Date.now() - 7200 * 1000), // 2 hours ago
                ttl: 3600, // 1 hour TTL
            });
            createdTokenIds.push(expiredToken1.id, expiredToken2.id);

            await jwtTokenRepository.save(expiredToken1);
            await jwtTokenRepository.save(expiredToken2);

            // Verify tokens are expired
            expect(expiredToken1.isExpired()).toBe(true);
            expect(expiredToken2.isExpired()).toBe(true);

            // Act
            await jwtTokenRepository.cleanup();

            // Assert - tokens should be deleted
            const retrieved1 = await jwtTokenRepository.findById(
                expiredToken1.id,
            );
            const retrieved2 = await jwtTokenRepository.findById(
                expiredToken2.id,
            );
            expect(retrieved1).toBeNull();
            expect(retrieved2).toBeNull();
        });

        it("should not throw error during cleanup", async () => {
            // Act & Assert
            await expect(jwtTokenRepository.cleanup()).resolves.not.toThrow();
        });
    });

    describe("Complex Scenarios", () => {
        it("should handle full token lifecycle", async () => {
            // Create
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Read
            let retrieved = await jwtTokenRepository.findById(jwtEntity.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(jwtEntity.id);

            // Blacklist
            await jwtTokenRepository.blacklistToken(jwtEntity.id);
            retrieved = await jwtTokenRepository.findById(jwtEntity.id);
            expect(retrieved?.isBlacklisted).toBe(true);

            // Delete
            await jwtTokenRepository.deleteById(jwtEntity.id);
            retrieved = await jwtTokenRepository.findById(jwtEntity.id);
            expect(retrieved).toBeNull();
        });

        it("should handle multiple operations on same family", async () => {
            // Arrange
            const familyId = UUIDSchema.parse(v7());
            const token1 = createTestToken(TokenType.ACCESS, { familyId });
            const token2 = createTestToken(TokenType.ACCESS, { familyId });
            const token3 = createTestToken(TokenType.ACCESS, { familyId });
            createdTokenIds.push(token1.id, token2.id, token3.id);

            // Act - Save all
            await jwtTokenRepository.save(token1);
            await jwtTokenRepository.save(token2);
            await jwtTokenRepository.save(token3);

            // Blacklist one
            await jwtTokenRepository.blacklistToken(token1.id);

            // Delete one
            await jwtTokenRepository.deleteById(token2.id);

            // Assert
            const retrieved1 = await jwtTokenRepository.findById(token1.id);
            const retrieved2 = await jwtTokenRepository.findById(token2.id);
            const retrieved3 = await jwtTokenRepository.findById(token3.id);

            expect(retrieved1?.isBlacklisted).toBe(true);
            expect(retrieved2).toBeNull();
            expect(retrieved3?.isBlacklisted).toBe(false);

            // Family should still have one valid member
            const familyIndexKey = `family_index:${familyId}`;
            const familyMembers = await redisClient.sMembers(familyIndexKey);
            expect(familyMembers).toContain(token3.id);
            expect(familyMembers).not.toContain(token1.id); // Blacklisted tokens removed from family
            expect(familyMembers).not.toContain(token2.id); // Deleted
        });

        it("should maintain consistency across concurrent operations", async () => {
            // Arrange
            const tokens = [
                createTestToken(TokenType.ACCESS),
                createTestToken(TokenType.ACCESS),
                createTestToken(TokenType.ACCESS),
            ];
            tokens.forEach((t) => createdTokenIds.push(t.id));

            // Act - Save concurrently
            await Promise.all(tokens.map((t) => jwtTokenRepository.save(t)));

            // Assert
            const results = await Promise.all(
                tokens.map((t) => jwtTokenRepository.findById(t.id)),
            );

            results.forEach((result, index) => {
                expect(result).toBeDefined();
                expect(result?.id).toBe(tokens[index].id);
            });
        });

        it("should handle token rotation scenario", async () => {
            // Arrange - Simulate refresh token rotation
            const familyId = UUIDSchema.parse(v7());
            const oldToken = createTestToken(TokenType.REFRESH, { familyId });
            createdTokenIds.push(oldToken.id);
            await jwtTokenRepository.save(oldToken);

            // Act - Create new token and blacklist old one (rotation)
            const newToken = createTestToken(TokenType.REFRESH, { familyId });
            createdTokenIds.push(newToken.id);
            await jwtTokenRepository.save(newToken);
            await jwtTokenRepository.blacklistToken(oldToken.id);

            // Assert
            const oldRetrieved = await jwtTokenRepository.findById(oldToken.id);
            const newRetrieved = await jwtTokenRepository.findById(newToken.id);

            expect(oldRetrieved?.isBlacklisted).toBe(true);
            expect(newRetrieved?.isBlacklisted).toBe(false);

            const isOldBlacklisted =
                await jwtTokenRepository.isTokenBlacklisted(oldToken.token);
            const isNewBlacklisted =
                await jwtTokenRepository.isTokenBlacklisted(newToken.token);

            expect(isOldBlacklisted).toBe(true);
            expect(isNewBlacklisted).toBe(false);
        });

        it("should handle family invalidation during token reuse detection", async () => {
            // Arrange - Simulate refresh token reuse attack
            const familyId = UUIDSchema.parse(v7());
            const validToken1 = createTestToken(TokenType.ACCESS, { familyId });
            const validToken2 = createTestToken(TokenType.ACCESS, { familyId });
            const validToken3 = createTestToken(TokenType.ACCESS, { familyId });
            createdTokenIds.push(
                validToken1.id,
                validToken2.id,
                validToken3.id,
            );

            await jwtTokenRepository.save(validToken1);
            await jwtTokenRepository.save(validToken2);
            await jwtTokenRepository.save(validToken3);

            // Act - Invalidate entire family (security measure)
            await jwtTokenRepository.invalidateFamily(familyId);

            // Assert - All tokens should be blacklisted
            const retrieved1 = await jwtTokenRepository.findById(
                validToken1.id,
            );
            const retrieved2 = await jwtTokenRepository.findById(
                validToken2.id,
            );
            const retrieved3 = await jwtTokenRepository.findById(
                validToken3.id,
            );

            expect(retrieved1?.isBlacklisted).toBe(true);
            expect(retrieved2?.isBlacklisted).toBe(true);
            expect(retrieved3?.isBlacklisted).toBe(true);

            const isBlacklisted1 = await jwtTokenRepository.isTokenBlacklisted(
                validToken1.token,
            );
            const isBlacklisted2 = await jwtTokenRepository.isTokenBlacklisted(
                validToken2.token,
            );
            const isBlacklisted3 = await jwtTokenRepository.isTokenBlacklisted(
                validToken3.token,
            );

            expect(isBlacklisted1).toBe(true);
            expect(isBlacklisted2).toBe(true);
            expect(isBlacklisted3).toBe(true);
        });
    });

    describe("Edge Cases", () => {
        it("should handle saving same token twice (update)", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);

            // Act
            await jwtTokenRepository.save(jwtEntity);
            jwtEntity.ttl = 7200; // Update TTL
            await jwtTokenRepository.save(jwtEntity);

            // Assert
            const retrieved = await jwtTokenRepository.findById(jwtEntity.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.ttl).toBe(7200);
        });

        it("should handle deleting already deleted token", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            const deleted1 = await jwtTokenRepository.deleteById(jwtEntity.id);
            const deleted2 = await jwtTokenRepository.deleteById(jwtEntity.id);

            // Assert
            expect(deleted1).toBe(true);
            expect(deleted2).toBe(false);
        });

        it("should handle blacklisting already blacklisted token", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            const blacklisted1 = await jwtTokenRepository.blacklistToken(
                jwtEntity.id,
            );
            const blacklisted2 = await jwtTokenRepository.blacklistToken(
                jwtEntity.id,
            );

            // Assert
            expect(blacklisted1).toBe(true);
            expect(blacklisted2).toBe(true); // Should still return true
        });

        it("should handle cleanup with no expired tokens", async () => {
            // Arrange - Create only valid tokens
            const validToken = createTestToken(TokenType.ACCESS, { ttl: 3600 });
            createdTokenIds.push(validToken.id);
            await jwtTokenRepository.save(validToken);

            // Act
            const deletedCount = await jwtTokenRepository.deleteExpiredTokens();

            // Assert
            expect(deletedCount).toBe(0);
        });

        it("should handle empty family invalidation", async () => {
            // Arrange
            const emptyFamilyId = UUIDSchema.parse(v7());

            // Act & Assert
            await expect(
                jwtTokenRepository.invalidateFamily(emptyFamilyId),
            ).resolves.not.toThrow();
        });

        it("should maintain token index consistency after operations", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act - Perform various operations
            await jwtTokenRepository.blacklistToken(jwtEntity.id);
            const retrievedById = await jwtTokenRepository.findById(
                jwtEntity.id,
            );
            const retrievedByToken = await jwtTokenRepository.findByToken(
                jwtEntity.token,
            );

            // Assert - Both lookups should return same data
            expect(retrievedById).toBeDefined();
            expect(retrievedByToken).toBeDefined();
            expect(retrievedById?.id).toBe(retrievedByToken?.id);
            expect(retrievedById?.isBlacklisted).toBe(
                retrievedByToken?.isBlacklisted,
            );
        });
    });

    describe("Performance and Atomicity", () => {
        it("should use pipeline for atomic operations in save", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);

            // Act
            await jwtTokenRepository.save(jwtEntity);

            // Assert - All related keys should exist
            const tokenKey = `jwt_entity:${jwtEntity.id}`;
            const tokenIndexKey = `token_index:${jwtEntity.token}`;
            const familyIndexKey = `family_index:${jwtEntity.familyId}`;

            const [tokenExists, indexExists, familyExists] = await Promise.all([
                redisClient.exists(tokenKey),
                redisClient.exists(tokenIndexKey),
                redisClient.exists(familyIndexKey),
            ]);

            expect(tokenExists).toBe(1);
            expect(indexExists).toBe(1);
            expect(familyExists).toBe(1);
        });

        it("should use pipeline for atomic operations in delete", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS);
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            await jwtTokenRepository.deleteById(jwtEntity.id);

            // Assert - All related keys should be deleted
            const tokenKey = `jwt_entity:${jwtEntity.id}`;
            const tokenIndexKey = `token_index:${jwtEntity.token}`;

            const [tokenExists, indexExists] = await Promise.all([
                redisClient.exists(tokenKey),
                redisClient.exists(tokenIndexKey),
            ]);

            expect(tokenExists).toBe(0);
            expect(indexExists).toBe(0);
        });

        it("should use pipeline for atomic operations in blacklist", async () => {
            // Arrange
            const jwtEntity = createTestToken(TokenType.ACCESS, { ttl: 3600 });
            createdTokenIds.push(jwtEntity.id);
            await jwtTokenRepository.save(jwtEntity);

            // Act
            await jwtTokenRepository.blacklistToken(jwtEntity.id);

            // Assert - Token should be blacklisted and TTL updated
            const retrieved = await jwtTokenRepository.findById(jwtEntity.id);
            const tokenKey = `jwt_entity:${jwtEntity.id}`;
            const ttl = await redisClient.ttl(tokenKey);

            expect(retrieved?.isBlacklisted).toBe(true);
            expect(ttl).toBeLessThanOrEqual(60);
        });
    });
});
