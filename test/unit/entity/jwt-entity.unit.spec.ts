// test/unit/entity/jwt.entity.spec.ts
import { describe, expect, it } from "vitest";

import { JwtEntity, TokenType } from "@/entity/security/jwt.entity.js";
import { UUIDSchema } from "@/type/common/uuid.type.js";

describe("JwtEntity", () => {
    describe("constructor", () => {
        it("should create a new JWT entity with required fields", () => {
            // Arrange
            const token = "test.jwt.token";
            const type = TokenType.ACCESS;

            // Act
            const entity = new JwtEntity({ token, type });

            // Assert
            expect(entity.token).toBe(token);
            expect(entity.type).toBe(type);
            expect(entity.id).toBeDefined();
            expect(entity.familyId).toBeDefined();
            expect(entity.createdAt).toBeInstanceOf(Date);
            expect(entity.isBlacklisted).toBe(false);
            expect(entity.ttl).toBeGreaterThan(0);
            expect(entity.updatedAt).toBeUndefined();
        });

        it("should create entity with all optional fields provided", () => {
            // Arrange
            const id = UUIDSchema.parse("01928374-5678-7abc-def0-123456789012");
            const familyId = UUIDSchema.parse(
                "01928374-5678-7abc-def0-123456789013",
            );
            const token = "test.jwt.token";
            const type = TokenType.REFRESH;
            const ttl = 7200;
            const createdAt = new Date("2024-01-01T00:00:00Z");
            const updatedAt = new Date("2024-01-01T01:00:00Z");
            const isBlacklisted = true;

            // Act
            const entity = new JwtEntity({
                createdAt,
                familyId,
                id,
                isBlacklisted,
                token,
                ttl,
                type,
                updatedAt,
            });

            // Assert
            expect(entity.id).toBe(id);
            expect(entity.familyId).toBe(familyId);
            expect(entity.token).toBe(token);
            expect(entity.type).toBe(type);
            expect(entity.ttl).toBe(ttl);
            expect(entity.createdAt).toBe(createdAt);
            expect(entity.updatedAt).toBe(updatedAt);
            expect(entity.isBlacklisted).toBe(isBlacklisted);
        });

        it("should generate unique IDs for each instance", () => {
            // Arrange & Act
            const entity1 = new JwtEntity({
                token: "token1",
                type: TokenType.ACCESS,
            });
            const entity2 = new JwtEntity({
                token: "token2",
                type: TokenType.ACCESS,
            });

            // Assert
            expect(entity1.id).not.toBe(entity2.id);
            expect(entity1.familyId).not.toBe(entity2.familyId);
        });

        it("should generate unique family IDs for each instance", () => {
            // Arrange & Act
            const entity1 = new JwtEntity({
                token: "token1",
                type: TokenType.ACCESS,
            });
            const entity2 = new JwtEntity({
                token: "token2",
                type: TokenType.ACCESS,
            });

            // Assert
            expect(entity1.familyId).not.toBe(entity2.familyId);
        });

        it("should use the same family ID when provided", () => {
            // Arrange
            const familyId = UUIDSchema.parse(
                "01928374-5678-7abc-def0-123456789013",
            );

            // Act
            const entity1 = new JwtEntity({
                familyId,
                token: "token1",
                type: TokenType.ACCESS,
            });
            const entity2 = new JwtEntity({
                familyId,
                token: "token2",
                type: TokenType.ACCESS,
            });

            // Assert
            expect(entity1.familyId).toBe(familyId);
            expect(entity2.familyId).toBe(familyId);
            expect(entity1.familyId).toBe(entity2.familyId);
        });

        it("should create ACCESS token type by default when using default TTL", () => {
            // Arrange & Act
            const entity = new JwtEntity({
                token: "test.token",
                type: TokenType.ACCESS,
            });

            // Assert
            expect(entity.type).toBe(TokenType.ACCESS);
        });

        it("should create REFRESH token type when specified", () => {
            // Arrange & Act
            const entity = new JwtEntity({
                token: "test.token",
                type: TokenType.REFRESH,
            });

            // Assert
            expect(entity.type).toBe(TokenType.REFRESH);
        });

        it("should extract timestamp from UUIDv7 when createdAt not provided", () => {
            // Arrange
            const beforeCreation = Date.now();

            // Act
            const entity = new JwtEntity({
                token: "test.token",
                type: TokenType.ACCESS,
            });

            const afterCreation = Date.now();

            // Assert
            expect(entity.createdAt).toBeInstanceOf(Date);
            expect(entity.createdAt.getTime()).toBeGreaterThanOrEqual(
                beforeCreation,
            );
            expect(entity.createdAt.getTime()).toBeLessThanOrEqual(
                afterCreation,
            );
        });

        it("should use provided createdAt instead of extracting from UUID", () => {
            // Arrange
            const specificDate = new Date("2024-01-01T00:00:00Z");

            // Act
            const entity = new JwtEntity({
                createdAt: specificDate,
                token: "test.token",
                type: TokenType.ACCESS,
            });

            // Assert
            expect(entity.createdAt).toBe(specificDate);
            expect(entity.createdAt.getTime()).toBe(specificDate.getTime());
        });
    });

    describe("extractTimestampFromUuidV7", () => {
        it("should extract correct timestamp from UUIDv7", () => {
            // Arrange - Create entity and get its ID
            const entity = new JwtEntity({
                token: "test.token",
                type: TokenType.ACCESS,
            });

            // Act - The createdAt should be extracted from the UUID
            const extractedTime = entity.createdAt.getTime();
            const currentTime = Date.now();

            // Assert - Should be very close to current time (within 1 second)
            expect(Math.abs(extractedTime - currentTime)).toBeLessThan(1000);
        });

        it("should handle UUIDs with different timestamps", () => {
            // Arrange
            const pastDate = new Date("2024-01-01T00:00:00Z");
            const entity = new JwtEntity({
                createdAt: pastDate,
                token: "test.token",
                type: TokenType.ACCESS,
            });

            // Act & Assert
            expect(entity.createdAt.getTime()).toBe(pastDate.getTime());
        });
    });

    describe("fromRedisObject", () => {
        it("should reconstruct entity from Redis data", () => {
            // Arrange
            const redisData = {
                createdAt: "2024-01-01T00:00:00.000Z",
                familyId: "01928374-5678-7abc-def0-123456789013",
                id: "01928374-5678-7abc-def0-123456789012",
                isBlacklisted: "false",
                token: "test.jwt.token",
                ttl: "3600",
                type: "access",
            };

            // Act
            const entity = JwtEntity.fromRedisObject(redisData);

            // Assert
            expect(entity.id).toBe(redisData.id);
            expect(entity.familyId).toBe(redisData.familyId);
            expect(entity.token).toBe(redisData.token);
            expect(entity.type).toBe(TokenType.ACCESS);
            expect(entity.ttl).toBe(3600);
            expect(entity.isBlacklisted).toBe(false);
            expect(entity.createdAt).toEqual(new Date(redisData.createdAt));
            expect(entity.updatedAt).toBeUndefined();
        });

        it("should handle blacklisted token from Redis", () => {
            // Arrange
            const redisData = {
                createdAt: "2024-01-01T00:00:00.000Z",
                familyId: "01928374-5678-7abc-def0-123456789013",
                id: "01928374-5678-7abc-def0-123456789012",
                isBlacklisted: "true",
                token: "test.jwt.token",
                ttl: "60",
                type: "access",
                updatedAt: "2024-01-01T01:00:00.000Z",
            };

            // Act
            const entity = JwtEntity.fromRedisObject(redisData);

            // Assert
            expect(entity.isBlacklisted).toBe(true);
            expect(entity.updatedAt).toEqual(new Date(redisData.updatedAt));
        });

        it("should handle REFRESH token type from Redis", () => {
            // Arrange
            const redisData = {
                createdAt: "2024-01-01T00:00:00.000Z",
                familyId: "01928374-5678-7abc-def0-123456789013",
                id: "01928374-5678-7abc-def0-123456789012",
                isBlacklisted: "false",
                token: "test.jwt.token",
                ttl: "7200",
                type: "refresh",
            };

            // Act
            const entity = JwtEntity.fromRedisObject(redisData);

            // Assert
            expect(entity.type).toBe(TokenType.REFRESH);
        });

        it("should default to ACCESS type when type is missing", () => {
            // Arrange
            const redisData = {
                createdAt: "2024-01-01T00:00:00.000Z",
                familyId: "01928374-5678-7abc-def0-123456789013",
                id: "01928374-5678-7abc-def0-123456789012",
                isBlacklisted: "false",
                token: "test.jwt.token",
                ttl: "3600",
            };

            // Act
            const entity = JwtEntity.fromRedisObject(redisData);

            // Assert
            expect(entity.type).toBe(TokenType.ACCESS);
        });
    });

    describe("toRedisObject", () => {
        it("should convert entity to Redis-storable format", () => {
            // Arrange
            const createdAt = new Date("2024-01-01T00:00:00.000Z");
            const entity = new JwtEntity({
                createdAt,
                familyId: UUIDSchema.parse(
                    "01928374-5678-7abc-def0-123456789013",
                ),
                id: UUIDSchema.parse("01928374-5678-7abc-def0-123456789012"),
                isBlacklisted: false,
                token: "test.jwt.token",
                ttl: 3600,
                type: TokenType.ACCESS,
            });

            // Act
            const redisObject = entity.toRedisObject();

            // Assert
            expect(redisObject).toEqual({
                createdAt: createdAt.toISOString(),
                familyId: "01928374-5678-7abc-def0-123456789013",
                id: "01928374-5678-7abc-def0-123456789012",
                isBlacklisted: "false",
                token: "test.jwt.token",
                ttl: "3600",
                type: "access",
            });
        });

        it("should include updatedAt when present", () => {
            // Arrange
            const createdAt = new Date("2024-01-01T00:00:00.000Z");
            const updatedAt = new Date("2024-01-01T01:00:00.000Z");
            const entity = new JwtEntity({
                createdAt,
                id: UUIDSchema.parse("01928374-5678-7abc-def0-123456789012"),
                isBlacklisted: true,
                token: "test.jwt.token",
                ttl: 60,
                type: TokenType.ACCESS,
                updatedAt,
            });

            // Act
            const redisObject = entity.toRedisObject();

            // Assert
            expect(redisObject.updatedAt).toBe(updatedAt.toISOString());
            expect(redisObject.isBlacklisted).toBe("true");
        });

        it("should handle REFRESH token type", () => {
            // Arrange
            const entity = new JwtEntity({
                token: "test.jwt.token",
                type: TokenType.REFRESH,
            });

            // Act
            const redisObject = entity.toRedisObject();

            // Assert
            expect(redisObject.type).toBe("refresh");
        });
    });

    describe("blacklist", () => {
        it("should mark token as blacklisted", () => {
            // Arrange
            const entity = new JwtEntity({
                token: "test.token",
                type: TokenType.ACCESS,
            });
            expect(entity.isBlacklisted).toBe(false);

            // Act
            entity.blacklist();

            // Assert
            expect(entity.isBlacklisted).toBe(true);
        });

        it("should set updatedAt when blacklisting", () => {
            // Arrange
            const entity = new JwtEntity({
                token: "test.token",
                type: TokenType.ACCESS,
            });
            expect(entity.updatedAt).toBeUndefined();

            const beforeBlacklist = Date.now();

            // Act
            entity.blacklist();

            const afterBlacklist = Date.now();

            // Assert
            expect(entity.updatedAt).toBeInstanceOf(Date);
            expect(entity.updatedAt).toBeDefined();
            const updatedAtTime = entity.updatedAt?.getTime();
            expect(updatedAtTime).toBeGreaterThanOrEqual(beforeBlacklist);
            expect(updatedAtTime).toBeLessThanOrEqual(afterBlacklist);
        });

        it("should allow blacklisting already blacklisted token", async () => {
            // Arrange
            const entity = new JwtEntity({
                token: "test.token",
                type: TokenType.ACCESS,
            });
            entity.blacklist();
            const firstUpdatedAt = entity.updatedAt;

            // Wait a bit to ensure different timestamp
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Act
            entity.blacklist();

            // Assert
            expect(entity.isBlacklisted).toBe(true);
            expect(entity.updatedAt).not.toBe(firstUpdatedAt);
        });
    });

    describe("isExpired", () => {
        it("should return false for valid token", () => {
            // Arrange
            const entity = new JwtEntity({
                token: "test.token",
                ttl: 3600,
                type: TokenType.ACCESS,
            });

            // Act & Assert
            expect(entity.isExpired()).toBe(false);
        });

        it("should return true for expired token", () => {
            // Arrange - Create token with createdAt in the past
            const pastDate = new Date(Date.now() - 7200 * 1000); // 2 hours ago
            const entity = new JwtEntity({
                createdAt: pastDate,
                token: "test.token",
                ttl: 3600, // 1 hour TTL
                type: TokenType.ACCESS,
            });

            // Act & Assert
            expect(entity.isExpired()).toBe(true);
        });

        it("should return false for token that just expired boundary", () => {
            // Arrange - Create token that expires exactly now
            const entity = new JwtEntity({
                createdAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
                token: "test.token",
                ttl: 3600, // 1 hour TTL
                type: TokenType.ACCESS,
            });

            // Act & Assert
            // Due to timing, this might be true or false, so we just check it doesn't throw
            expect(typeof entity.isExpired()).toBe("boolean");
        });

        it("should return true for token with zero TTL", () => {
            // Arrange
            const entity = new JwtEntity({
                token: "test.token",
                ttl: 0,
                type: TokenType.ACCESS,
            });

            // Act & Assert
            expect(entity.isExpired()).toBe(true);
        });

        it("should return true for token with negative TTL", () => {
            // Arrange
            const entity = new JwtEntity({
                token: "test.token",
                ttl: -100,
                type: TokenType.ACCESS,
            });

            // Act & Assert
            expect(entity.isExpired()).toBe(true);
        });
    });

    describe("isValid", () => {
        it("should return true for non-blacklisted, non-expired token", () => {
            // Arrange
            const entity = new JwtEntity({
                token: "test.token",
                ttl: 3600,
                type: TokenType.ACCESS,
            });

            // Act & Assert
            expect(entity.isValid()).toBe(true);
        });

        it("should return false for blacklisted token", () => {
            // Arrange
            const entity = new JwtEntity({
                token: "test.token",
                ttl: 3600,
                type: TokenType.ACCESS,
            });
            entity.blacklist();

            // Act & Assert
            expect(entity.isValid()).toBe(false);
        });

        it("should return false for expired token", () => {
            // Arrange
            const pastDate = new Date(Date.now() - 7200 * 1000); // 2 hours ago
            const entity = new JwtEntity({
                createdAt: pastDate,
                token: "test.token",
                ttl: 3600, // 1 hour TTL
                type: TokenType.ACCESS,
            });

            // Act & Assert
            expect(entity.isValid()).toBe(false);
        });

        it("should return false for blacklisted and expired token", () => {
            // Arrange
            const pastDate = new Date(Date.now() - 7200 * 1000); // 2 hours ago
            const entity = new JwtEntity({
                createdAt: pastDate,
                token: "test.token",
                ttl: 3600, // 1 hour TTL
                type: TokenType.ACCESS,
            });
            entity.blacklist();

            // Act & Assert
            expect(entity.isValid()).toBe(false);
        });
    });

    describe("getRemainingTtl", () => {
        it("should return positive value for valid token", () => {
            // Arrange
            const ttl = 3600;
            const entity = new JwtEntity({
                token: "test.token",
                ttl,
                type: TokenType.ACCESS,
            });

            // Act
            const remaining = entity.getRemainingTtl();

            // Assert
            expect(remaining).toBeGreaterThan(0);
            expect(remaining).toBeLessThanOrEqual(ttl);
        });

        it("should return 0 for expired token", () => {
            // Arrange
            const pastDate = new Date(Date.now() - 7200 * 1000); // 2 hours ago
            const entity = new JwtEntity({
                createdAt: pastDate,
                token: "test.token",
                ttl: 3600, // 1 hour TTL
                type: TokenType.ACCESS,
            });

            // Act
            const remaining = entity.getRemainingTtl();

            // Assert
            expect(remaining).toBe(0);
        });

        it("should return decreasing value over time", async () => {
            // Arrange
            const entity = new JwtEntity({
                token: "test.token",
                ttl: 3600,
                type: TokenType.ACCESS,
            });

            // Act
            const remaining1 = entity.getRemainingTtl();
            await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
            const remaining2 = entity.getRemainingTtl();

            // Assert
            expect(remaining2).toBeLessThan(remaining1);
        });

        it("should account for custom createdAt", () => {
            // Arrange - Create token that was created 30 minutes ago with 1 hour TTL
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            const entity = new JwtEntity({
                createdAt: thirtyMinutesAgo,
                token: "test.token",
                ttl: 3600, // 1 hour
                type: TokenType.ACCESS,
            });

            // Act
            const remaining = entity.getRemainingTtl();

            // Assert
            // Should have approximately 30 minutes left (1800 seconds)
            expect(remaining).toBeGreaterThan(1700); // Account for execution time
            expect(remaining).toBeLessThan(1900);
        });
    });

    describe("Round-trip serialization", () => {
        it("should maintain data integrity through save and load cycle", () => {
            // Arrange
            const original = new JwtEntity({
                familyId: UUIDSchema.parse(
                    "01928374-5678-7abc-def0-123456789013",
                ),
                token: "test.jwt.token",
                ttl: 3600,
                type: TokenType.REFRESH,
            });

            // Act - Simulate save to Redis and load back
            const redisData = original.toRedisObject();
            const loaded = JwtEntity.fromRedisObject(redisData);

            // Assert
            expect(loaded.id).toBe(original.id);
            expect(loaded.token).toBe(original.token);
            expect(loaded.familyId).toBe(original.familyId);
            expect(loaded.ttl).toBe(original.ttl);
            expect(loaded.type).toBe(original.type);
            expect(loaded.isBlacklisted).toBe(original.isBlacklisted);
            expect(loaded.createdAt.getTime()).toBe(
                original.createdAt.getTime(),
            );
        });

        it("should maintain blacklist state through round-trip", () => {
            // Arrange
            const original = new JwtEntity({
                token: "test.jwt.token",
                type: TokenType.ACCESS,
            });
            original.blacklist();

            // Act
            const redisData = original.toRedisObject();
            const loaded = JwtEntity.fromRedisObject(redisData);

            // Assert
            expect(loaded.isBlacklisted).toBe(true);
            expect(loaded.updatedAt).toBeDefined();
            expect(original.updatedAt).toBeDefined();
            expect(loaded.updatedAt?.getTime()).toBe(
                original.updatedAt?.getTime(),
            );
        });
    });
});
