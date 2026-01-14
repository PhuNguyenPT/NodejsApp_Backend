// test/integration/service/user.service.integration.spec.ts
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { IUserService } from "@/service/user-service.interface.js";

import { iocContainer } from "@/app/ioc-container.js";
import { redisClient } from "@/config/redis.config.js";
import { CreateUserAdminDTO } from "@/dto/user/create-user.js";
import { UpdateUserAdminDTO } from "@/dto/user/update-user.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { getApp } from "@/test/setup.js";
import { TYPES } from "@/type/container/types.js";
import {
    getDefaultPermissionsByRole,
    Permission,
    Role,
} from "@/type/enum/user.js";
import { EntityExistsException } from "@/type/exception/entity-exists.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { CacheKeys } from "@/util/cache-key.js";

describe("UserService Integration Tests", () => {
    beforeAll(() => {
        getApp();
    });

    // Get service from IOC container (infrastructure initialized by setup.ts)
    const getUserService = (): IUserService => {
        const service = iocContainer.get<IUserService>(TYPES.IUserService);
        return service;
    };

    let createdUserIds: string[] = [];

    beforeEach(() => {
        // Reset tracking array
        createdUserIds = [];
    });

    afterAll(async () => {
        // Cleanup all created test users (NOT infrastructure - setup.ts handles that)
        const userService = getUserService();
        for (const userId of createdUserIds) {
            try {
                await userService.delete(userId);
            } catch (_error) {
                // Ignore errors during cleanup
            }
        }
    });

    describe("create", () => {
        it("should create a new user with all fields", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                name: "Test User",
                password: "SecurePass123!",
                phoneNumbers: ["+84 123 456 789", "+1 555 123 4567"],
                role: Role.USER,
            };

            // Act
            const result = await userService.create(createDto);
            createdUserIds.push(result.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.email).toBe(createDto.email);
            expect(result.name).toBe(createDto.name);
            expect(result.role).toBe(Role.USER);
            expect(result.phoneNumbers).toEqual(createDto.phoneNumbers);
            expect(result.permissions).toBeDefined();
            expect(result.permissions.length).toBeGreaterThan(0);
            expect(result.accountNonExpired).toBe(true);
            expect(result.accountNonLocked).toBe(true);
            expect(result.credentialsNonExpired).toBe(true);
            expect(result.enabled).toBe(true);
            expect(result.createdAt).toBeDefined();
            expect(result.updatedAt).toBeDefined();
        });

        it("should hash password when creating user", async () => {
            const userService = getUserService();

            // Arrange
            const plainPassword = "SecurePass123!";
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: plainPassword,
                role: Role.USER,
            };

            // Act
            const result = await userService.create(createDto);
            createdUserIds.push(result.id);

            // Assert
            expect(result.password).not.toBe(plainPassword);
            expect(result.password).toMatch(/^\$2b\$12\$/);
            const isValid = await bcrypt.compare(
                plainPassword,
                result.password,
            );
            expect(isValid).toBe(true);
        });

        it("should assign default permissions based on role", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.ADMIN,
            };

            // Act
            const result = await userService.create(createDto);
            createdUserIds.push(result.id);

            // Assert
            expect(result.permissions).toContain(Permission.ADMIN_ACCESS);
            expect(result.permissions).toContain(Permission.USER_CREATE);
            expect(result.permissions).toContain(Permission.USER_DELETE);
            expect(result.permissions.length).toBeGreaterThan(15);
        });

        it("should create user with minimal required fields", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.USER,
            };

            // Act
            const result = await userService.create(createDto);
            createdUserIds.push(result.id);

            // Assert
            expect(result.id).toBeDefined();
            expect(result.email).toBe(createDto.email);
            expect(result.name).toBeNull();
            expect(result.phoneNumbers).toBeNull();
        });

        it("should throw EntityExistsException for duplicate email", async () => {
            const userService = getUserService();

            // Arrange
            const email = `test-${Date.now().toString()}@example.com`;
            const createDto: CreateUserAdminDTO = {
                email,
                password: "SecurePass123!",
                role: Role.USER,
            };

            const firstUser = await userService.create(createDto);
            createdUserIds.push(firstUser.id);

            // Act & Assert
            await expect(userService.create(createDto)).rejects.toThrow(
                EntityExistsException,
            );
            await expect(userService.create(createDto)).rejects.toThrow(
                `User with email ${email} already exists`,
            );
        });

        it("should create users with different roles", async () => {
            const userService = getUserService();

            // Arrange & Act
            const roles = [
                Role.USER,
                Role.MODERATOR,
                Role.ADMIN,
                Role.ANONYMOUS,
            ];
            const createdUsers: UserEntity[] = [];

            for (const role of roles) {
                const createDto: CreateUserAdminDTO = {
                    email: `test-${role}-${Date.now().toString()}@example.com`,
                    password: "SecurePass123!",
                    role,
                };
                const user = await userService.create(createDto);
                createdUserIds.push(user.id);
                createdUsers.push(user);
            }

            // Assert
            expect(createdUsers[0].role).toBe(Role.USER);
            expect(createdUsers[1].role).toBe(Role.MODERATOR);
            expect(createdUsers[2].role).toBe(Role.ADMIN);
            expect(createdUsers[3].role).toBe(Role.ANONYMOUS);

            // Verify permission differences
            expect(createdUsers[2].permissions.length).toBeGreaterThan(
                createdUsers[0].permissions.length,
            );
        });
    });

    describe("getById", () => {
        it("should retrieve existing user by id", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                name: "Get By ID Test",
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            // Act
            const result = await userService.getById(created.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(created.id);
            expect(result.email).toBe(created.email);
            expect(result.name).toBe(created.name);
        });

        it("should throw EntityNotFoundException for non-existent user", async () => {
            const userService = getUserService();

            // Arrange
            const nonExistentId = "00000000-0000-0000-0000-000000000000";

            // Act & Assert
            await expect(userService.getById(nonExistentId)).rejects.toThrow(
                EntityNotFoundException,
            );
            await expect(userService.getById(nonExistentId)).rejects.toThrow(
                `User with id ${nonExistentId} not found`,
            );
        });

        it("should use cache on second retrieval", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            // Act
            const firstResult = await userService.getById(created.id);
            const secondResult = await userService.getById(created.id);

            // Assert - both results should be identical
            expect(firstResult.id).toBe(secondResult.id);
            expect(firstResult.email).toBe(secondResult.email);

            // Verify cache exists
            const cacheKey = CacheKeys.user(created.id);
            const cached = await redisClient.get(cacheKey);
            expect(cached).toBeDefined();
        });
    });

    describe("getByIdAndName", () => {
        it("should retrieve user by id and name", async () => {
            const userService = getUserService();

            // Arrange
            const name = "Specific Name User";
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                name,
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            // Act
            const result = await userService.getByIdAndName(created.id, name);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(created.id);
            expect(result.name).toBe(name);
        });

        it("should retrieve user by id only when name is undefined", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                name: "Test User",
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            // Act
            const result = await userService.getByIdAndName(created.id);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(created.id);
        });

        it("should throw EntityNotFoundException for wrong name", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                name: "Correct Name",
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            // Act & Assert
            await expect(
                userService.getByIdAndName(created.id, "Wrong Name"),
            ).rejects.toThrow(EntityNotFoundException);
        });
    });

    describe("getAll", () => {
        it("should retrieve all users", async () => {
            const userService = getUserService();

            // Arrange
            const initialCount = (await userService.getAll()).length;

            const createDto1: CreateUserAdminDTO = {
                email: `test1-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.USER,
            };
            const createDto2: CreateUserAdminDTO = {
                email: `test2-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.ADMIN,
            };

            const user1 = await userService.create(createDto1);
            const user2 = await userService.create(createDto2);
            createdUserIds.push(user1.id, user2.id);

            // Act
            const result = await userService.getAll();

            // Assert
            expect(result).toBeDefined();
            expect(result.length).toBe(initialCount + 2);
            expect(result.some((u) => u.id === user1.id)).toBe(true);
            expect(result.some((u) => u.id === user2.id)).toBe(true);
        });

        it("should return array of users", async () => {
            const userService = getUserService();

            const result = await userService.getAll();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe("exists", () => {
        it("should return true for existing user", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            // Act
            const result = await userService.exists(created.id);

            // Assert
            expect(result).toBe(true);
        });

        it("should return false for non-existent user", async () => {
            const userService = getUserService();

            // Arrange
            const nonExistentId = "00000000-0000-0000-0000-000000000000";

            // Act
            const result = await userService.exists(nonExistentId);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe("update", () => {
        it("should update user basic fields", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                name: "Original Name",
                password: "SecurePass123!",
                phoneNumbers: ["+84 111 111 111"],
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            const mockUser: Express.User = {
                email: "admin@example.com",
                id: v4(),
                permissions: getDefaultPermissionsByRole(Role.ADMIN),
                role: Role.ADMIN,
            };

            const updateDto: Partial<UpdateUserAdminDTO> = {
                email: `updated-${Date.now().toString()}@example.com`,
                name: "Updated Name",
                phoneNumbers: ["+84 999 999 999"],
            };

            // Act
            const result = await userService.update(
                created.id,
                updateDto,
                mockUser,
            );

            // Assert
            expect(result.email).toBe(updateDto.email);
            expect(result.name).toBe(updateDto.name);
            expect(result.phoneNumbers).toEqual(updateDto.phoneNumbers);
            expect(result.updatedBy).toBe(mockUser.email);
        });

        it("should hash new password when updating", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            const mockUser: Express.User = {
                email: "admin@example.com",
                id: v4(),
                permissions: getDefaultPermissionsByRole(Role.ADMIN),
                role: Role.ADMIN,
            };

            const newPassword = "NewSecurePass123!";
            const updateDto: Partial<UpdateUserAdminDTO> = {
                password: newPassword,
            };

            // Act
            const result = await userService.update(
                created.id,
                updateDto,
                mockUser,
            );

            // Assert
            expect(result.password).not.toBe(newPassword);
            expect(result.password).not.toBe(created.password);
            expect(result.password).toMatch(/^\$2b\$12\$/);
            const isValid = await bcrypt.compare(newPassword, result.password);
            expect(isValid).toBe(true);
        });

        it("should update permissions when role changes", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            const mockUser: Express.User = {
                email: "admin@example.com",
                id: v4(),
                permissions: getDefaultPermissionsByRole(Role.ADMIN),
                role: Role.ADMIN,
            };

            const updateDto: Partial<UpdateUserAdminDTO> = {
                role: Role.ADMIN,
            };

            // Act
            const result = await userService.update(
                created.id,
                updateDto,
                mockUser,
            );

            // Assert
            expect(result.role).toBe(Role.ADMIN);
            expect(result.permissions).toContain(Permission.ADMIN_ACCESS);
            expect(result.permissions).toContain(Permission.USER_DELETE);
            expect(result.permissions.length).toBeGreaterThan(
                created.permissions.length,
            );
        });

        it("should not update permissions when role is not changed", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            const originalPermissions = [...created.permissions];

            const mockUser: Express.User = {
                email: "admin@example.com",
                id: v4(),
                permissions: getDefaultPermissionsByRole(Role.ADMIN),
                role: Role.ADMIN,
            };

            const updateDto: Partial<UpdateUserAdminDTO> = {
                name: "Updated Name Only",
            };

            // Act
            const result = await userService.update(
                created.id,
                updateDto,
                mockUser,
            );

            // Assert
            expect(result.name).toBe("Updated Name Only");
            expect(result.permissions).toEqual(originalPermissions);
        });

        it("should throw EntityNotFoundException for non-existent user", async () => {
            const userService = getUserService();

            // Arrange
            const nonExistentId = "00000000-0000-0000-0000-000000000000";
            const mockUser: Express.User = {
                email: "admin@example.com",
                id: v4(),
                permissions: getDefaultPermissionsByRole(Role.ADMIN),
                role: Role.ADMIN,
            };
            const updateDto: Partial<UpdateUserAdminDTO> = {
                name: "New Name",
            };

            // Act & Assert
            await expect(
                userService.update(nonExistentId, updateDto, mockUser),
            ).rejects.toThrow(EntityNotFoundException);
        });

        it("should invalidate cache after update", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            // Populate cache
            await userService.getById(created.id);
            const cacheKey = CacheKeys.user(created.id);
            const cachedBefore = await redisClient.get(cacheKey);
            expect(cachedBefore).toBeDefined();

            const mockUser: Express.User = {
                email: "admin@example.com",
                id: v4(),
                permissions: getDefaultPermissionsByRole(Role.ADMIN),
                role: Role.ADMIN,
            };

            const updateDto: Partial<UpdateUserAdminDTO> = {
                name: "Updated Name",
            };

            // Act
            await userService.update(created.id, updateDto, mockUser);

            // Assert - cache should be invalidated
            const cachedAfter = await redisClient.get(cacheKey);
            expect(cachedAfter).toBeNull();
        });

        it("should handle partial updates correctly", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                name: "Original Name",
                password: "SecurePass123!",
                phoneNumbers: ["+84 123 456 789"],
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            const mockUser: Express.User = {
                email: "admin@example.com",
                id: v4(),
                permissions: getDefaultPermissionsByRole(Role.ADMIN),
                role: Role.ADMIN,
            };

            // Act - Update only name
            const updateDto: Partial<UpdateUserAdminDTO> = {
                name: "Only Name Updated",
            };
            const result = await userService.update(
                created.id,
                updateDto,
                mockUser,
            );

            // Assert
            expect(result.name).toBe("Only Name Updated");
            expect(result.email).toBe(created.email);
            expect(result.phoneNumbers).toEqual(created.phoneNumbers);
            expect(result.role).toBe(created.role);
        });
    });

    describe("delete", () => {
        it("should delete existing user", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);

            // Act
            await userService.delete(created.id);

            // Assert
            await expect(userService.getById(created.id)).rejects.toThrow(
                EntityNotFoundException,
            );
            const exists = await userService.exists(created.id);
            expect(exists).toBe(false);
        });

        it("should invalidate cache after deletion", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);

            // Populate cache
            await userService.getById(created.id);
            const cacheKey = CacheKeys.user(created.id);
            const cachedBefore = await redisClient.get(cacheKey);
            expect(cachedBefore).toBeDefined();

            // Act
            await userService.delete(created.id);

            // Assert
            const cachedAfter = await redisClient.get(cacheKey);
            expect(cachedAfter).toBeNull();
        });

        it("should not throw error when deleting non-existent user", async () => {
            const userService = getUserService();

            // Arrange
            const nonExistentId = "00000000-0000-0000-0000-000000000000";

            // Act & Assert - should not throw
            await expect(
                userService.delete(nonExistentId),
            ).resolves.not.toThrow();
        });
    });

    describe("Complex Scenarios", () => {
        it("should handle multiple updates in sequence", async () => {
            const userService = getUserService();

            // Arrange
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                name: "Original",
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            const mockUser: Express.User = {
                email: "admin@example.com",
                id: v4(),
                permissions: getDefaultPermissionsByRole(Role.ADMIN),
                role: Role.ADMIN,
            };

            // Act - Multiple updates
            const update1 = await userService.update(
                created.id,
                { name: "First Update" },
                mockUser,
            );
            const update2 = await userService.update(
                created.id,
                { name: "Second Update" },
                mockUser,
            );
            const update3 = await userService.update(
                created.id,
                { role: Role.MODERATOR },
                mockUser,
            );

            // Assert
            expect(update1.name).toBe("First Update");
            expect(update2.name).toBe("Second Update");
            expect(update3.name).toBe("Second Update");
            expect(update3.role).toBe(Role.MODERATOR);
        });

        it("should maintain data integrity across create-read-update-delete cycle", async () => {
            const userService = getUserService();

            // Create
            const createDto: CreateUserAdminDTO = {
                email: `test-${Date.now().toString()}@example.com`,
                name: "CRUD Test",
                password: "SecurePass123!",
                role: Role.USER,
            };
            const created = await userService.create(createDto);
            createdUserIds.push(created.id);

            // Read
            const retrieved = await userService.getById(created.id);
            expect(retrieved.email).toBe(created.email);

            // Update
            const mockUser: Express.User = {
                email: "admin@example.com",
                id: v4(),
                permissions: getDefaultPermissionsByRole(Role.ADMIN),
                role: Role.ADMIN,
            };
            const updated = await userService.update(
                created.id,
                { name: "Updated CRUD Test" },
                mockUser,
            );
            expect(updated.name).toBe("Updated CRUD Test");

            // Delete
            await userService.delete(created.id);
            await expect(userService.getById(created.id)).rejects.toThrow(
                EntityNotFoundException,
            );
        });

        it("should throw EntityExistsException when updating to duplicate email", async () => {
            const userService = getUserService();

            // Arrange
            const user1 = await userService.create({
                email: `user1-${Date.now().toString()}@example.com`,
                password: "Pass123!",
                role: Role.USER,
            });
            createdUserIds.push(user1.id);

            const user2 = await userService.create({
                email: `user2-${Date.now().toString()}@example.com`,
                password: "Pass123!",
                role: Role.USER,
            });
            createdUserIds.push(user2.id);

            const mockUser: Express.User = {
                email: "admin@example.com",
                id: v4(),
                permissions: getDefaultPermissionsByRole(Role.ADMIN),
                role: Role.ADMIN,
            };

            // Act & Assert
            await expect(
                userService.update(user2.id, { email: user1.email }, mockUser),
            ).rejects.toThrow(EntityExistsException);

            await expect(
                userService.update(user2.id, { email: user1.email }, mockUser),
            ).rejects.toThrow(`User with email ${user1.email} already exists`);
        });

        describe("Edge Cases", () => {
            it("should handle empty phone numbers array", async () => {
                const userService = getUserService();

                const createDto: CreateUserAdminDTO = {
                    email: `test-${Date.now().toString()}@example.com`,
                    password: "SecurePass123!",
                    phoneNumbers: [],
                    role: Role.USER,
                };

                const result = await userService.create(createDto);
                createdUserIds.push(result.id);

                expect(result.phoneNumbers).toEqual([]);
            });

            it("should handle updating to same email (no-op case)", async () => {
                const userService = getUserService();

                const created = await userService.create({
                    email: `test-${Date.now().toString()}@example.com`,
                    password: "Pass123!",
                    role: Role.USER,
                });
                createdUserIds.push(created.id);

                const mockUser: Express.User = {
                    email: "admin@example.com",
                    id: v4(),
                    permissions: getDefaultPermissionsByRole(Role.ADMIN),
                    role: Role.ADMIN,
                };

                const result = await userService.update(
                    created.id,
                    { email: created.email },
                    mockUser,
                );

                expect(result.email).toBe(created.email);
            });

            it("should handle role update to same role", async () => {
                const userService = getUserService();

                const created = await userService.create({
                    email: `test-${Date.now().toString()}@example.com`,
                    password: "Pass123!",
                    role: Role.USER,
                });
                createdUserIds.push(created.id);

                const mockUser: Express.User = {
                    email: "admin@example.com",
                    id: v4(),
                    permissions: getDefaultPermissionsByRole(Role.ADMIN),
                    role: Role.ADMIN,
                };

                const originalPermissions = created.permissions;

                const result = await userService.update(
                    created.id,
                    { role: Role.USER },
                    mockUser,
                );

                expect(result.role).toBe(Role.USER);
                expect(result.permissions).toEqual(originalPermissions);
            });
        });
    });
});
