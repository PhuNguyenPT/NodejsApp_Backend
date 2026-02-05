import type { RedisClientType } from "redis";

import { v7 as uuidv7 } from "uuid";
// test/integration/service/jwt-service.integration.spec.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { IJwtRepository } from "@/repository/jwt-repository-interface.js";
import type { IJwtService } from "@/service/jwt-service.interface.js";
import type { CustomJwtPayload } from "@/type/interface/jwt.interface.js";

import { iocContainer } from "@/app/ioc-container.js";
import { TokenType } from "@/entity/security/jwt.entity.js";
import { getApp } from "@/test/setup.js";
import { type UUID, UUIDSchema } from "@/type/common/uuid.type.js";
import { TYPES } from "@/type/container/types.js";
import { getDefaultPermissionsByRole, Role } from "@/type/enum/user.enum.js";

describe("JwtService Integration Tests", () => {
    let jwtService: IJwtService;
    let jwtRepository: IJwtRepository;
    let redisClient: RedisClientType;
    const createdTokens: string[] = [];
    const testFamilyIds: UUID[] = [];
    // Helper to create test payload
    const createTestPayload = (
        type: TokenType = TokenType.ACCESS,
    ): CustomJwtPayload => ({
        email: `test-${Date.now().toString()}@example.com`,
        id: UUIDSchema.parse(uuidv7()),
        name: "Test User",
        permissions: getDefaultPermissionsByRole(Role.USER),
        role: Role.USER,
        type,
    });

    // Helper to create family ID
    const createFamilyId = (): UUID => UUIDSchema.parse(uuidv7());

    beforeAll(() => {
        getApp();
        redisClient = iocContainer.get<RedisClientType>(TYPES.RedisPublisher);
        jwtService = iocContainer.get<IJwtService>(TYPES.IJwtService);
        jwtRepository = iocContainer.get<IJwtRepository>(TYPES.IJwtRepository);
    });

    afterAll(async () => {
        for (const token of createdTokens) {
            await jwtRepository.deleteByToken(token);
        }

        for (const familyId of testFamilyIds) {
            const familyIndexKey = `family_index:${familyId}`;
            await redisClient.del(familyIndexKey);
        }
    });

    describe("generateAccessToken", () => {
        it("should successfully generate an access token", async () => {
            // Arrange
            const payload = createTestPayload(TokenType.ACCESS);
            const familyId = createFamilyId();

            // Act
            const token = await jwtService.generateAccessToken(
                payload,
                familyId,
            );
            createdTokens.push(token);
            testFamilyIds.push(familyId);

            // Assert
            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
            expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
        });

        it("should store access token in Redis with correct TTL", async () => {
            // Arrange
            const payload = createTestPayload(TokenType.ACCESS);
            const familyId = createFamilyId();

            // Act
            const token = await jwtService.generateAccessToken(
                payload,
                familyId,
            );
            createdTokens.push(token);
            testFamilyIds.push(familyId);

            // Assert - Verify token exists in Redis
            const jwtEntity = await jwtRepository.findByToken(token);
            expect(jwtEntity).toBeDefined();
            expect(jwtEntity?.type).toBe(TokenType.ACCESS);
            expect(jwtEntity?.familyId).toBe(familyId);
            expect(jwtEntity?.isValid()).toBe(true);
        });

        it("should generate unique tokens for same payload", async () => {
            // Arrange
            const payload = createTestPayload(TokenType.ACCESS);
            const familyId = createFamilyId();

            // Act
            const token1 = await jwtService.generateAccessToken(
                payload,
                familyId,
            );
            const token2 = await jwtService.generateAccessToken(
                payload,
                familyId,
            );
            createdTokens.push(token1, token2);

            // Assert
            expect(token1).not.toStrictEqual(token2);
        });

        it("should include correct payload in generated token", async () => {
            // Arrange
            const payload = createTestPayload(TokenType.ACCESS);
            const familyId = createFamilyId();

            // Act
            const token = await jwtService.generateAccessToken(
                payload,
                familyId,
            );
            createdTokens.push(token);
            testFamilyIds.push(familyId);
            const decoded = jwtService.decodeToken(token);

            // Assert
            expect(decoded).toBeDefined();
            expect(decoded?.id).toStrictEqual(payload.id);
            expect(decoded?.email).toBe(payload.email);
            expect(decoded?.name).toBe(payload.name);
            expect(decoded?.type).toStrictEqual(TokenType.ACCESS);
            expect(decoded?.role).toStrictEqual(payload.role);
            expect(decoded?.permissions).toStrictEqual(payload.permissions);

            expect(decoded?.iat).not.toStrictEqual(payload.iat);
            expect(decoded?.iss).not.toStrictEqual(payload.iss);
            expect(decoded?.jti).not.toStrictEqual(payload.jti);
            expect(decoded?.exp).not.toStrictEqual(payload.exp);
            expect(decoded?.aud).not.toStrictEqual(payload.aud);

            expect(decoded?.iat).toBeDefined();
            expect(decoded?.iss).toBeDefined();
            expect(decoded?.jti).toBeDefined();
            expect(decoded?.exp).toBeDefined();
            expect(decoded?.aud).toBeDefined();

            expect(decoded?.nbf).toBeUndefined();
            expect(decoded?.sub).toBeUndefined();
        });
    });

    describe("generateRefreshToken", () => {
        it("should successfully generate a refresh token", async () => {
            // Arrange
            const payload = createTestPayload(TokenType.REFRESH);
            const familyId = createFamilyId();

            // Act
            const token = await jwtService.generateRefreshToken(
                payload,
                familyId,
            );
            createdTokens.push(token);
            testFamilyIds.push(familyId);

            // Assert
            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
            expect(token.split(".")).toHaveLength(3);
        });

        it("should store refresh token in Redis with longer TTL than access token", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);
            const familyId = createFamilyId();

            // Act
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);

            // Assert
            const accessEntity = await jwtRepository.findByToken(accessToken);
            const refreshEntity = await jwtRepository.findByToken(refreshToken);

            expect(refreshEntity?.ttl).toBeGreaterThan(accessEntity?.ttl ?? 0);
        });

        it("should generate refresh token with REFRESH type in payload", async () => {
            // Arrange
            const payload = createTestPayload(TokenType.REFRESH);
            const familyId = createFamilyId();

            // Act
            const token = await jwtService.generateRefreshToken(
                payload,
                familyId,
            );
            createdTokens.push(token);
            testFamilyIds.push(familyId);

            const decoded = jwtService.decodeToken(token);

            // Assert
            expect(decoded).toBeDefined();
            expect(decoded?.id).toStrictEqual(payload.id);
            expect(decoded?.email).toBe(payload.email);
            expect(decoded?.name).toBe(payload.name);
            expect(decoded?.type).toStrictEqual(TokenType.REFRESH);
            expect(decoded?.role).toStrictEqual(payload.role);
            expect(decoded?.permissions).toStrictEqual(payload.permissions);

            expect(decoded?.iat).not.toStrictEqual(payload.iat);
            expect(decoded?.iss).not.toStrictEqual(payload.iss);
            expect(decoded?.jti).not.toStrictEqual(payload.jti);
            expect(decoded?.exp).not.toStrictEqual(payload.exp);
            expect(decoded?.aud).not.toStrictEqual(payload.aud);

            expect(decoded?.iat).toBeDefined();
            expect(decoded?.iss).toBeDefined();
            expect(decoded?.jti).toBeDefined();
            expect(decoded?.exp).toBeDefined();
            expect(decoded?.aud).toBeDefined();

            expect(decoded?.nbf).toBeUndefined();
            expect(decoded?.sub).toBeUndefined();
        });

        it("should link refresh token to same family as access token", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);
            const familyId = createFamilyId();

            // Act
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);

            // Assert
            const accessEntity = await jwtRepository.findByToken(accessToken);
            const refreshEntity = await jwtRepository.findByToken(refreshToken);

            expect(accessEntity?.familyId).toStrictEqual(familyId);
            expect(refreshEntity?.familyId).toStrictEqual(familyId);
        });
    });

    describe("verifyToken", () => {
        it("should successfully verify a valid access token", async () => {
            // Arrange
            const payload = createTestPayload(TokenType.ACCESS);
            const familyId = createFamilyId();
            const token = await jwtService.generateAccessToken(
                payload,
                familyId,
            );
            createdTokens.push(token);
            testFamilyIds.push(familyId);

            // Act
            const verified = await jwtService.verifyToken(token);

            // Assert
            expect(verified).toBeDefined();
            expect(verified.id).toStrictEqual(payload.id);
            expect(verified.email).toBe(payload.email);
            expect(verified.name).toBe(payload.name);
            expect(verified.type).toStrictEqual(TokenType.ACCESS);
            expect(verified.role).toStrictEqual(payload.role);
            expect(verified.permissions).toStrictEqual(payload.permissions);
        });

        it("should successfully verify a valid refresh token", async () => {
            // Arrange
            const payload = createTestPayload(TokenType.REFRESH);
            const familyId = createFamilyId();
            const token = await jwtService.generateRefreshToken(
                payload,
                familyId,
            );
            createdTokens.push(token);
            testFamilyIds.push(familyId);

            // Act
            const verified = await jwtService.verifyToken(token);

            // Assert
            expect(verified).toBeDefined();
            expect(verified.id).toStrictEqual(payload.id);
            expect(verified.email).toBe(payload.email);
            expect(verified.name).toBe(payload.name);
            expect(verified.type).toStrictEqual(TokenType.REFRESH);
            expect(verified.role).toStrictEqual(payload.role);
            expect(verified.permissions).toStrictEqual(payload.permissions);
        });

        it("should throw error for invalid token format", async () => {
            // Arrange
            const invalidToken = "invalid.token.format";

            // Act & Assert
            await expect(jwtService.verifyToken(invalidToken)).rejects.toThrow(
                Error,
            );
        });

        it("should throw error for token not in Redis", async () => {
            // Arrange - Generate token but delete from Redis
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);

            const familyId = createFamilyId();
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            await jwtRepository.deleteByToken(accessToken);
            await jwtRepository.deleteByToken(refreshToken);

            // Act & Assert
            await expect(jwtService.verifyToken(accessToken)).rejects.toThrow(
                "Invalid or blacklisted token",
            );
            await expect(jwtService.verifyToken(refreshToken)).rejects.toThrow(
                "Invalid or blacklisted token",
            );
        });

        it("should throw error for blacklisted token", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);

            const familyId = createFamilyId();
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            // Blacklist the token
            await jwtRepository.blacklistTokenByValue(accessToken);
            await jwtRepository.blacklistTokenByValue(refreshToken);

            // Act & Assert
            await expect(jwtService.verifyToken(accessToken)).rejects.toThrow(
                "Invalid or blacklisted token",
            );
            await expect(jwtService.verifyToken(refreshToken)).rejects.toThrow(
                "Invalid or blacklisted token",
            );
        });

        it("should throw error for tampered token", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);

            const familyId = createFamilyId();
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            // Tamper with token
            const accessParts = accessToken.split(".");
            const tamperedAccessToken = `${accessParts[0]}.${accessParts[1]}.tampered`;
            const refreshParts = accessToken.split(".");
            const tamperedRefreshToken = `${refreshParts[0]}.${refreshParts[1]}.tampered`;
            // Act & Assert
            await expect(
                jwtService.verifyToken(tamperedAccessToken),
            ).rejects.toThrow(Error);
            await expect(
                jwtService.verifyToken(tamperedRefreshToken),
            ).rejects.toThrow(Error);
        });

        it("should verify token with all payload fields", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);

            const familyId = createFamilyId();
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            // Act
            const verifiedAccessToken =
                await jwtService.verifyToken(accessToken);
            const verifiedRefreshToken =
                await jwtService.verifyToken(refreshToken);

            // Assert
            expect(verifiedAccessToken.id).toStrictEqual(accessPayload.id);
            expect(verifiedAccessToken.email).toBe(accessPayload.email);
            expect(verifiedAccessToken.name).toBe(accessPayload.name);
            expect(verifiedAccessToken.type).toStrictEqual(accessPayload.type);
            expect(verifiedAccessToken.role).toStrictEqual(accessPayload.role);
            expect(verifiedAccessToken.permissions).toStrictEqual(
                accessPayload.permissions,
            );

            expect(verifiedAccessToken.jti).toBeDefined();
            expect(verifiedAccessToken.iss).toBeDefined();
            expect(verifiedAccessToken.iat).toBeDefined();
            expect(verifiedAccessToken.exp).toBeDefined();
            expect(verifiedAccessToken.aud).toBeDefined();
            expect(verifiedAccessToken.nbf).toBeUndefined();
            expect(verifiedAccessToken.sub).toBeUndefined();

            expect(verifiedRefreshToken.id).toStrictEqual(refreshPayload.id);
            expect(verifiedRefreshToken.email).toBe(refreshPayload.email);
            expect(verifiedRefreshToken.name).toBe(refreshPayload.name);
            expect(verifiedRefreshToken.type).toStrictEqual(
                refreshPayload.type,
            );
            expect(verifiedRefreshToken.role).toStrictEqual(
                refreshPayload.role,
            );
            expect(verifiedRefreshToken.permissions).toStrictEqual(
                refreshPayload.permissions,
            );

            expect(verifiedRefreshToken.jti).toBeDefined();
            expect(verifiedRefreshToken.iss).toBeDefined();
            expect(verifiedRefreshToken.iat).toBeDefined();
            expect(verifiedRefreshToken.exp).toBeDefined();
            expect(verifiedRefreshToken.aud).toBeDefined();
            expect(verifiedRefreshToken.nbf).toBeUndefined();
            expect(verifiedRefreshToken.sub).toBeUndefined();
        });
    });

    describe("decodeToken", () => {
        it("should successfully decode a valid token without verification", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);

            const familyId = createFamilyId();
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            // Act
            const decodedAccessToken = jwtService.decodeToken(accessToken);
            const decodedRefreshToken = jwtService.decodeToken(refreshToken);

            // Assert
            expect(decodedAccessToken).toBeDefined();
            expect(decodedAccessToken?.id).toBe(accessPayload.id);
            expect(decodedAccessToken?.email).toBe(accessPayload.email);
            expect(decodedAccessToken?.type).toBe(accessPayload.type);

            expect(decodedRefreshToken).toBeDefined();
            expect(decodedRefreshToken?.id).toBe(refreshPayload.id);
            expect(decodedRefreshToken?.email).toBe(refreshPayload.email);
            expect(decodedRefreshToken?.type).toBe(refreshPayload.type);
        });

        it("should return null for invalid token format", () => {
            // Arrange
            const invalidToken = "not.a.valid.jwt";

            // Act
            const decoded = jwtService.decodeToken(invalidToken);

            // Assert
            expect(decoded).toBeNull();
        });

        it("should decode token even if blacklisted", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);

            const familyId = createFamilyId();
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            await jwtRepository.blacklistTokenByValue(accessToken);

            // Act - Decode should still work (no verification)
            const decodedAccessToken = jwtService.decodeToken(accessToken);
            const decodedRefreshToken = jwtService.decodeToken(refreshToken);

            // Assert
            expect(decodedAccessToken).toBeDefined();
            expect(decodedAccessToken?.id).toBe(accessPayload.id);

            expect(decodedRefreshToken).toBeDefined();
            expect(decodedRefreshToken?.id).toBe(refreshPayload.id);
        });

        it("should return null for token with invalid payload structure", () => {
            // Arrange - This would be a manually crafted token with wrong structure
            const invalidToken =
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpbnZhbGlkIjoidHJ1ZSJ9.invalid";

            // Act
            const decoded = jwtService.decodeToken(invalidToken);

            // Assert
            expect(decoded).toBeNull();
        });
    });

    describe("Token Expiration", () => {
        it("should include expiration time in token", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);

            const familyId = createFamilyId();
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            const decodedAccessToken = jwtService.decodeToken(accessToken);
            const decodedRefreshToken = jwtService.decodeToken(refreshToken);

            // Assert
            expect(decodedAccessToken?.exp).toBeDefined();
            expect(decodedAccessToken?.iat).toBeDefined();
            expect(decodedAccessToken?.exp).toBeGreaterThan(
                decodedAccessToken?.iat ?? 0,
            );

            expect(decodedRefreshToken?.exp).toBeDefined();
            expect(decodedRefreshToken?.iat).toBeDefined();
            expect(decodedRefreshToken?.exp).toBeGreaterThan(
                decodedRefreshToken?.iat ?? 0,
            );
        });

        it("should have longer expiration for refresh token than access token", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);
            const familyId = createFamilyId();

            // Act
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            const accessDecoded = jwtService.decodeToken(accessToken);
            const refreshDecoded = jwtService.decodeToken(refreshToken);

            // Assert
            expect(refreshDecoded?.exp).toBeGreaterThan(
                accessDecoded?.exp ?? 0,
            );
        });
    });

    describe("Token Family Management", () => {
        it("should maintain family relationship across multiple tokens", async () => {
            // Arrange
            const familyId = createFamilyId();
            const user1Payload = createTestPayload(TokenType.ACCESS);
            const user2Payload = createTestPayload(TokenType.REFRESH);

            // Act
            const token1 = await jwtService.generateAccessToken(
                user1Payload,
                familyId,
            );
            const token2 = await jwtService.generateRefreshToken(
                user2Payload,
                familyId,
            );
            createdTokens.push(token1, token2);
            testFamilyIds.push(familyId);

            // Assert
            const entity1 = await jwtRepository.findByToken(token1);
            const entity2 = await jwtRepository.findByToken(token2);

            expect(entity1?.familyId).toBe(familyId);
            expect(entity2?.familyId).toBe(familyId);
        });

        it("should create different families for different token sets", async () => {
            // Arrange
            const familyId1 = createFamilyId();
            const familyId2 = createFamilyId();
            const payload1 = createTestPayload(TokenType.ACCESS);
            const payload2 = createTestPayload(TokenType.ACCESS);

            // Act
            const token1 = await jwtService.generateAccessToken(
                payload1,
                familyId1,
            );
            const token2 = await jwtService.generateAccessToken(
                payload2,
                familyId2,
            );
            createdTokens.push(token1, token2);
            testFamilyIds.push(familyId1, familyId2);

            // Assert
            const entity1 = await jwtRepository.findByToken(token1);
            const entity2 = await jwtRepository.findByToken(token2);

            expect(entity1?.familyId).not.toBe(entity2?.familyId);
        });
    });

    describe("Payload Validation", () => {
        it("should validate payload with all required fields", async () => {
            // Arrange
            const payload = createTestPayload(TokenType.ACCESS);
            const familyId = createFamilyId();
            const token = await jwtService.generateAccessToken(
                payload,
                familyId,
            );
            createdTokens.push(token);
            testFamilyIds.push(familyId);

            // Act
            const verified = await jwtService.verifyToken(token);

            // Assert
            expect(verified.id).toBeDefined();
            expect(verified.email).toBeDefined();
            expect(verified.type).toBeDefined();
        });

        it("should handle payload with optional name field", async () => {
            // Arrange
            const payload: CustomJwtPayload = {
                email: "test-jwt-service@example.com",
                id: UUIDSchema.parse(uuidv7()),
                role: Role.USER,
                type: TokenType.ACCESS,
                // name is optional
            };
            const familyId = createFamilyId();

            // Act
            const token = await jwtService.generateAccessToken(
                payload,
                familyId,
            );
            createdTokens.push(token);
            testFamilyIds.push(familyId);

            const verified = await jwtService.verifyToken(token);

            // Assert
            expect(verified).toBeDefined();
            expect(verified.id).toBe(payload.id);
            expect(verified.email).toBe(payload.email);
        });

        it("should validate token type is ACCESS or REFRESH", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);
            const familyId = createFamilyId();

            // Act
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            const accessVerified = await jwtService.verifyToken(accessToken);
            const refreshVerified = await jwtService.verifyToken(refreshToken);

            // Assert
            expect([TokenType.ACCESS, TokenType.REFRESH]).toContain(
                accessVerified.type,
            );
            expect([TokenType.ACCESS, TokenType.REFRESH]).toContain(
                refreshVerified.type,
            );
        });
    });

    describe("Error Handling", () => {
        it("should handle concurrent token generation gracefully", async () => {
            // Arrange
            const payload = createTestPayload(TokenType.ACCESS);
            const familyId = createFamilyId();

            // Act
            const tokenPromises = Array.from({ length: 5 }, () =>
                jwtService.generateAccessToken(payload, familyId),
            );
            const tokens = await Promise.all(tokenPromises);
            createdTokens.push(...tokens);
            testFamilyIds.push(familyId);

            // Assert
            expect(tokens).toHaveLength(5);
            tokens.forEach((token) => {
                expect(token).toBeDefined();
            });

            // All tokens should be unique
            const uniqueTokens = new Set(tokens);
            expect(uniqueTokens.size).toBe(5);
        });

        it("should handle concurrent verification gracefully", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);

            const familyId = createFamilyId();
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            // Act
            const verifyAccessPromises = Array.from({ length: 5 }, () =>
                jwtService.verifyToken(accessToken),
            );
            const verifyRefreshPromises = Array.from({ length: 5 }, () =>
                jwtService.verifyToken(refreshToken),
            );
            const accessResults = await Promise.all(verifyAccessPromises);
            const refreshResults = await Promise.all(verifyRefreshPromises);

            // Assert
            expect(accessResults).toHaveLength(5);
            accessResults.forEach((result) => {
                expect(result.id).toBe(accessPayload.id);
                expect(result.email).toBe(accessPayload.email);
            });
            expect(refreshResults).toHaveLength(5);
            refreshResults.forEach((result) => {
                expect(result.id).toBe(refreshPayload.id);
                expect(result.email).toBe(refreshPayload.email);
            });
        });
    });

    describe("Complex Scenarios", () => {
        it("should handle complete token lifecycle: generate -> verify -> blacklist -> verify fails", async () => {
            // Arrange
            const accessPayload = createTestPayload(TokenType.ACCESS);
            const refreshPayload = createTestPayload(TokenType.REFRESH);

            const familyId = createFamilyId();

            // Step 1: Generate
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            expect(accessToken).toBeDefined();
            expect(refreshToken).toBeDefined();

            // Step 2: Verify (should succeed)
            const accessVerified = await jwtService.verifyToken(accessToken);
            expect(accessVerified.id).toBe(accessPayload.id);
            const refreshVerified = await jwtService.verifyToken(refreshToken);
            expect(refreshVerified.id).toBe(refreshPayload.id);

            // Step 3: Blacklist
            const accessResult =
                await jwtRepository.blacklistTokenByValue(accessToken);
            const refreshResult =
                await jwtRepository.blacklistTokenByValue(refreshToken);
            expect(accessResult).toStrictEqual(true);
            expect(refreshResult).toStrictEqual(true);

            // Step 4: Verify (should fail)
            await expect(jwtService.verifyToken(accessToken)).rejects.toThrow(
                "Invalid or blacklisted token",
            );
            await expect(jwtService.verifyToken(refreshToken)).rejects.toThrow(
                "Invalid or blacklisted token",
            );
        });

        it("should maintain separate access and refresh tokens for same user", async () => {
            // Arrange
            const userId = UUIDSchema.parse(uuidv7());
            const email = "user@example.com";
            const familyId = createFamilyId();

            const accessPayload: CustomJwtPayload = {
                email,
                id: userId,
                permissions: getDefaultPermissionsByRole(Role.USER),
                role: Role.USER,
                type: TokenType.ACCESS,
            };

            const refreshPayload: CustomJwtPayload = {
                email,
                id: userId,
                permissions: getDefaultPermissionsByRole(Role.USER),
                role: Role.USER,
                type: TokenType.REFRESH,
            };

            // Act
            const accessToken = await jwtService.generateAccessToken(
                accessPayload,
                familyId,
            );
            const refreshToken = await jwtService.generateRefreshToken(
                refreshPayload,
                familyId,
            );
            createdTokens.push(accessToken, refreshToken);
            testFamilyIds.push(familyId);

            // Assert
            const accessVerified = await jwtService.verifyToken(accessToken);
            const refreshVerified = await jwtService.verifyToken(refreshToken);

            expect(accessVerified.id).toBe(userId);
            expect(refreshVerified.id).toBe(userId);
            expect(accessVerified.type).toBe(TokenType.ACCESS);
            expect(refreshVerified.type).toBe(TokenType.REFRESH);
            expect(accessToken).not.toStrictEqual(refreshToken);
        });

        it("should handle token rotation scenario", async () => {
            // Arrange
            const userId = UUIDSchema.parse(uuidv7());
            const email = "rotation@example.com";
            const familyId = createFamilyId();

            const payload: CustomJwtPayload = {
                email,
                id: userId,
                permissions: getDefaultPermissionsByRole(Role.USER),
                role: Role.USER,
                type: TokenType.REFRESH,
            };

            // Act - Generate initial token
            const token1 = await jwtService.generateRefreshToken(
                payload,
                familyId,
            );
            createdTokens.push(token1);
            testFamilyIds.push(familyId);

            // Verify first token works
            await jwtService.verifyToken(token1);

            // Blacklist first token (simulating rotation)
            await jwtRepository.blacklistTokenByValue(token1);

            // Generate new token
            const token2 = await jwtService.generateRefreshToken(
                payload,
                familyId,
            );
            createdTokens.push(token2);

            // Assert - Old token should fail, new should work
            await expect(jwtService.verifyToken(token1)).rejects.toThrow(Error);
            const verified = await jwtService.verifyToken(token2);
            expect(verified.id).toStrictEqual(userId);
        });
    });
});
