// test/integration/service/auth-service.integration.spec.ts
import { type DataSource, Repository } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { IJwtTokenRepository } from "@/repository/jwt-token-repository-interface.js";
import type { IAuthService } from "@/service/auth-service.interface.js";

import { iocContainer } from "@/app/ioc-container.js";
import { LoginRequest, RegisterRequest } from "@/dto/auth/auth-request.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { getApp } from "@/test/setup.js";
import { UUIDSchema } from "@/type/common/uuid.type.js";
import { TYPES } from "@/type/container/types.js";
import { BadCredentialsException } from "@/type/exception/bad-credentials.exception.js";
import { EntityExistsException } from "@/type/exception/entity-exists.exception.js";
import { JwtException } from "@/type/exception/jwt.exception.js";

describe("AuthService Integration Tests", () => {
    let dataSource: DataSource;
    let authService: IAuthService;
    let userRepository: Repository<UserEntity>;
    let jwtTokenRepository: IJwtTokenRepository;
    const createdUserIds: string[] = [];
    const createdTokens: string[] = [];
    const testEmail = "test@example.com";
    const testPassword = "TestPassword123!";

    const trackTokens = (result: {
        accessToken?: string;
        refreshToken?: string;
    }) => {
        if (result.accessToken) {
            createdTokens.push(result.accessToken);
        }
        if (result.refreshToken) {
            createdTokens.push(result.refreshToken);
        }
    };

    beforeAll(async () => {
        getApp();

        dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        authService = iocContainer.get<IAuthService>(TYPES.IAuthService);
        userRepository = dataSource.getRepository(UserEntity);
        jwtTokenRepository = iocContainer.get<IJwtTokenRepository>(
            TYPES.IJwtTokenRepository,
        );

        const testUsers = await userRepository.find({
            where: { email: testEmail },
        });

        for (const user of testUsers) {
            await userRepository.delete(user.id);
        }
    });

    afterAll(async () => {
        for (const token of createdTokens) {
            await jwtTokenRepository.deleteByToken(token);
        }

        for (const userId of createdUserIds) {
            await userRepository.delete(userId);
        }
    });

    describe("register", () => {
        it("should successfully register a new user", async () => {
            // Arrange
            const registerRequest: RegisterRequest = {
                email: `test-${Date.now().toString()}@example.com`,
                password: testPassword,
            };

            // Act
            const result = await authService.register(registerRequest);
            if (result.user?.id) {
                createdUserIds.push(result.user.id);
            }
            trackTokens(result);

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.message).toBe("Registration successful");
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.user?.email).toBe(
                registerRequest.email.toLowerCase(),
            );
            expect(result.expiresIn).toBeGreaterThan(0);
        });

        it("should throw EntityExistsException when registering duplicate email", async () => {
            // Arrange
            const email = `duplicate_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };

            // First registration
            const firstResult = await authService.register(registerRequest);
            if (firstResult.user?.id) {
                createdUserIds.push(firstResult.user.id);
            }
            trackTokens(firstResult);

            // Act & Assert - Second registration should fail
            await expect(authService.register(registerRequest)).rejects.toThrow(
                EntityExistsException,
            );
        });

        it("should hash the password before storing", async () => {
            // Arrange
            const registerRequest: RegisterRequest = {
                email: `hash_test_${Date.now().toString()}@example.com`,
                password: testPassword,
            };

            // Act
            const result = await authService.register(registerRequest);
            trackTokens(result);

            // Assert
            expect(result.user).toBeDefined();
            expect(result.user?.id).toBeDefined();

            if (!result.user?.id) {
                throw new Error("User ID is undefined");
            }

            const userId = result.user.id;
            createdUserIds.push(userId);

            // Retrieve user from database
            const savedUser = await userRepository.findOne({
                where: { id: UUIDSchema.parse(userId) },
            });

            expect(savedUser).toBeDefined();
            expect(savedUser?.password).not.toBe(testPassword);
            expect(savedUser?.password).toMatch(/^\$2[aby]\$.{56}$/);
        });

        it("should convert email to lowercase", async () => {
            // Arrange
            const registerRequest: RegisterRequest = {
                email: `UpPeRcAsE_${Date.now().toString()}@EXAMPLE.COM`,
                password: testPassword,
            };

            // Act
            const result = await authService.register(registerRequest);
            if (result.user?.id) {
                createdUserIds.push(result.user.id);
            }
            trackTokens(result);

            // Assert
            expect(result.user?.email).toBe(
                registerRequest.email.toLowerCase(),
            );
        });
    });

    describe("login", () => {
        it("should successfully login with valid credentials", async () => {
            // Arrange - Register a user first
            const email = `login_test_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const registerResult = await authService.register(registerRequest);
            if (registerResult.user?.id) {
                createdUserIds.push(registerResult.user.id);
            }
            trackTokens(registerResult);

            // Act - Login
            const loginRequest: LoginRequest = {
                email,
                password: testPassword,
            };
            const loginResult = await authService.login(loginRequest);
            trackTokens(loginResult);

            // Assert
            expect(loginResult).toBeDefined();
            expect(loginResult.success).toBe(true);
            expect(loginResult.message).toBe("Login successful");
            expect(loginResult.accessToken).toBeDefined();
            expect(loginResult.refreshToken).toBeDefined();
            expect(loginResult.user?.email).toBe(email.toLowerCase());
        });

        it("should throw BadCredentialsException with wrong password", async () => {
            // Arrange - Register a user first
            const email = `wrong_pwd_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const registerResult = await authService.register(registerRequest);
            if (registerResult.user?.id) {
                createdUserIds.push(registerResult.user.id);
            }
            trackTokens(registerResult);

            // Act & Assert
            const loginRequest: LoginRequest = {
                email,
                password: "WrongPassword123!",
            };
            await expect(authService.login(loginRequest)).rejects.toThrow(
                BadCredentialsException,
            );
        });

        it("should throw BadCredentialsException with non-existent email", async () => {
            // Arrange
            const loginRequest: LoginRequest = {
                email: "nonexistent@example.com",
                password: testPassword,
            };

            // Act & Assert
            await expect(authService.login(loginRequest)).rejects.toThrow(
                BadCredentialsException,
            );
        });

        it("should handle email case-insensitively", async () => {
            // Arrange - Register with lowercase email
            const email = `case_test_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email: email.toLowerCase(),
                password: testPassword,
            };
            const registerResult = await authService.register(registerRequest);
            if (registerResult.user?.id) {
                createdUserIds.push(registerResult.user.id);
            }
            trackTokens(registerResult);

            // Act - Login with uppercase email
            const loginRequest: LoginRequest = {
                email: email.toUpperCase(),
                password: testPassword,
            };
            const loginResult = await authService.login(loginRequest);
            trackTokens(loginResult);

            // Assert
            expect(loginResult.success).toBe(true);
            expect(loginResult.user?.email).toBe(email.toLowerCase());
        });
    });

    describe("refreshToken", () => {
        it("should successfully refresh tokens with valid refresh token", async () => {
            // Arrange - Register and login
            const email = `refresh_test_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const loginResult = await authService.register(registerRequest);
            if (loginResult.user?.id) {
                createdUserIds.push(loginResult.user.id);
            }
            trackTokens(loginResult);

            // Act - Refresh token
            const refreshToken = loginResult.refreshToken;
            expect(refreshToken).toBeDefined();

            if (!refreshToken) {
                throw new Error("Refresh token is undefined");
            }

            const refreshResult = await authService.refreshToken(refreshToken);
            trackTokens(refreshResult);

            // Assert
            expect(refreshResult).toBeDefined();
            expect(refreshResult.success).toBe(true);
            expect(refreshResult.message).toBe("Token refresh successful");
            expect(refreshResult.accessToken).toBeDefined();
            expect(refreshResult.refreshToken).toBeDefined();
            expect(refreshResult.accessToken).not.toBe(loginResult.accessToken);
            expect(refreshResult.refreshToken).not.toBe(refreshToken);
        });

        it("should throw JwtException when reusing blacklisted refresh token", async () => {
            // Arrange
            const email = `reuse_test_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const loginResult = await authService.register(registerRequest);
            if (loginResult.user?.id) {
                createdUserIds.push(loginResult.user.id);
            }
            trackTokens(loginResult);

            const refreshToken = loginResult.refreshToken;
            expect(refreshToken).toBeDefined();

            if (!refreshToken) {
                throw new Error("Refresh token is undefined");
            }

            // Use refresh token once
            const refreshResult = await authService.refreshToken(refreshToken);
            trackTokens(refreshResult);

            // Act & Assert - Try to reuse the same token
            await expect(
                authService.refreshToken(refreshToken),
            ).rejects.toThrow(JwtException);
        });

        it("should throw JwtException with invalid refresh token", async () => {
            // Act & Assert
            await expect(
                authService.refreshToken("invalid.token.here"),
            ).rejects.toThrow();
        });

        it("should invalidate entire token family on token reuse detection", async () => {
            // Arrange
            const email = `family_test_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const loginResult = await authService.register(registerRequest);
            if (loginResult.user?.id) {
                createdUserIds.push(loginResult.user.id);
            }
            trackTokens(loginResult);

            const initialRefreshToken = loginResult.refreshToken;
            expect(initialRefreshToken).toBeDefined();

            if (!initialRefreshToken) {
                throw new Error("Initial refresh token is undefined");
            }

            const firstRefresh =
                await authService.refreshToken(initialRefreshToken);
            trackTokens(firstRefresh);

            const newRefreshToken = firstRefresh.refreshToken;
            expect(newRefreshToken).toBeDefined();

            if (!newRefreshToken) {
                throw new Error("New refresh token is undefined");
            }

            let expectedError: unknown;
            // Act - Try to reuse old refresh token (should detect reuse)
            try {
                await authService.refreshToken(initialRefreshToken);
            } catch (error) {
                // Expected to fail
                expectedError = error;
            }

            // Assert - New tokens should also be invalid
            expect(expectedError).toBeInstanceOf(JwtException);
            await expect(
                authService.refreshToken(newRefreshToken),
            ).rejects.toThrow(JwtException);
        });
    });

    describe("logout", () => {
        it("should successfully logout with valid tokens", async () => {
            // Arrange
            const email = `logout_test_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const loginResult = await authService.register(registerRequest);
            if (loginResult.user?.id) {
                createdUserIds.push(loginResult.user.id);
            }
            trackTokens(loginResult);

            const accessToken = loginResult.accessToken;
            const refreshToken = loginResult.refreshToken;
            expect(accessToken).toBeDefined();
            expect(refreshToken).toBeDefined();

            if (!accessToken || !refreshToken) {
                throw new Error("Tokens are undefined");
            }

            // Act
            const logoutResult = await authService.logout(
                accessToken,
                refreshToken,
            );

            // Assert
            expect(logoutResult).toBeDefined();
            expect(logoutResult.success).toBe(true);
            expect(logoutResult.message).toBe("Logout successful");
        });

        it("should blacklist tokens after logout", async () => {
            // Arrange
            const email = `blacklist_test_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const loginResult = await authService.register(registerRequest);
            if (loginResult.user?.id) {
                createdUserIds.push(loginResult.user.id);
            }
            trackTokens(loginResult);

            const accessToken = loginResult.accessToken;
            const refreshToken = loginResult.refreshToken;
            expect(accessToken).toBeDefined();
            expect(refreshToken).toBeDefined();

            if (!accessToken || !refreshToken) {
                throw new Error("Tokens are undefined");
            }

            // Act - Logout
            await authService.logout(accessToken, refreshToken);

            // Assert - Try to use refresh token after logout
            await expect(
                authService.refreshToken(refreshToken),
            ).rejects.toThrow(JwtException);
        });

        it("should handle logout with only access token", async () => {
            // Arrange
            const email = `access_only_logout_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const loginResult = await authService.register(registerRequest);
            if (loginResult.user?.id) {
                createdUserIds.push(loginResult.user.id);
            }
            trackTokens(loginResult);

            const accessToken = loginResult.accessToken;
            expect(accessToken).toBeDefined();

            if (!accessToken) {
                throw new Error("Access token is undefined");
            }

            // Act - Logout with only access token
            const logoutResult = await authService.logout(accessToken);

            // Assert
            expect(logoutResult.success).toBe(true);
        });

        it("should fail logout with invalid access token", async () => {
            // Act
            const logoutResult = await authService.logout("invalid.token");

            // Assert
            expect(logoutResult.success).toBe(false);
        });
    });

    describe("Complex Scenarios", () => {
        it("should handle complete auth flow: register -> login -> refresh -> logout", async () => {
            // Step 1: Register
            const email = `complete_flow_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const registerResult = await authService.register(registerRequest);
            if (registerResult.user?.id) {
                createdUserIds.push(registerResult.user.id);
            }
            trackTokens(registerResult);
            expect(registerResult.success).toBe(true);

            // Step 2: Login
            const loginRequest: LoginRequest = {
                email,
                password: testPassword,
            };
            const loginResult = await authService.login(loginRequest);
            trackTokens(loginResult);
            expect(loginResult.success).toBe(true);

            const loginRefreshToken = loginResult.refreshToken;
            expect(loginRefreshToken).toBeDefined();

            if (!loginRefreshToken) {
                throw new Error("Login refresh token is undefined");
            }

            // Step 3: Refresh token
            const refreshResult =
                await authService.refreshToken(loginRefreshToken);
            trackTokens(refreshResult);
            expect(refreshResult.success).toBe(true);

            const refreshAccessToken = refreshResult.accessToken;
            const refreshRefreshToken = refreshResult.refreshToken;
            expect(refreshAccessToken).toBeDefined();
            expect(refreshRefreshToken).toBeDefined();

            if (!refreshAccessToken || !refreshRefreshToken) {
                throw new Error("Refresh tokens are undefined");
            }

            // Step 4: Logout
            const logoutResult = await authService.logout(
                refreshAccessToken,
                refreshRefreshToken,
            );
            expect(logoutResult.success).toBe(true);
        });

        it("should maintain token family across multiple refreshes", async () => {
            // Arrange
            const email = `family_chain_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const initialResult = await authService.register(registerRequest);
            if (initialResult.user?.id) {
                createdUserIds.push(initialResult.user.id);
            }
            trackTokens(initialResult);

            // Act - Perform multiple refreshes
            let currentRefreshToken = initialResult.refreshToken;
            expect(currentRefreshToken).toBeDefined();

            if (!currentRefreshToken) {
                throw new Error("Initial refresh token is undefined");
            }

            const refreshCount = 3;

            for (let i = 0; i < refreshCount; i++) {
                const refreshResult =
                    await authService.refreshToken(currentRefreshToken);
                trackTokens(refreshResult);
                expect(refreshResult.success).toBe(true);
                currentRefreshToken = refreshResult.refreshToken;
                expect(currentRefreshToken).toBeDefined();

                if (!currentRefreshToken) {
                    throw new Error("Current refresh token is undefined");
                }
            }

            // Assert - Final tokens should be valid
            const finalRefresh =
                await authService.refreshToken(currentRefreshToken);
            trackTokens(finalRefresh);
            expect(finalRefresh.success).toBe(true);
        });

        it("should prevent login after account logout", async () => {
            // Arrange
            const email = `prevent_after_logout_${Date.now().toString()}@example.com`;
            const registerRequest: RegisterRequest = {
                email,
                password: testPassword,
            };
            const registerResult = await authService.register(registerRequest);
            if (registerResult.user?.id) {
                createdUserIds.push(registerResult.user.id);
            }
            trackTokens(registerResult);

            const accessToken = registerResult.accessToken;
            const refreshToken = registerResult.refreshToken;
            expect(accessToken).toBeDefined();
            expect(refreshToken).toBeDefined();

            if (!accessToken || !refreshToken) {
                throw new Error("Tokens are undefined");
            }

            await authService.logout(accessToken, refreshToken);

            // Act - Login again should work (new token family)
            const loginRequest: LoginRequest = {
                email,
                password: testPassword,
            };
            const loginResult = await authService.login(loginRequest);
            trackTokens(loginResult);

            // Assert
            expect(loginResult.success).toBe(true);
            expect(loginResult.accessToken).not.toBe(accessToken);
        });
    });
});
