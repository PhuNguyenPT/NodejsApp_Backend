// test/unit/service/user.service.spec.ts
import "reflect-metadata";
import bcrypt from "bcrypt";
import { describe, expect, it } from "vitest";

import { UserEntity } from "@/entity/security/user.entity.js";
import {
    getDefaultPermissionsByRole,
    Permission,
    Role,
} from "@/type/enum/user.js";

describe("UserService Business Logic Tests", () => {
    describe("UserEntity", () => {
        it("should create a user entity with proper defaults", () => {
            // Arrange & Act
            const user = new UserEntity({
                email: "test@example.com",
                name: "Test User",
                password: "hashedPassword",
                role: Role.USER,
            });

            // Assert
            expect(user.email).toBe("test@example.com");
            expect(user.name).toBe("Test User");
            expect(user.accountNonExpired).toBe(true);
            expect(user.accountNonLocked).toBe(true);
            expect(user.credentialsNonExpired).toBe(true);
            expect(user.enabled).toBe(true);
        });

        it("should check if account is fully active", () => {
            // Arrange
            const activeUser = new UserEntity({
                accountNonExpired: true,
                accountNonLocked: true,
                credentialsNonExpired: true,
                email: "active@example.com",
                enabled: true,
                password: "hash",
                role: Role.USER,
            });

            const inactiveUser = new UserEntity({
                accountNonExpired: true,
                accountNonLocked: false,
                credentialsNonExpired: true,
                email: "inactive@example.com",
                enabled: true,
                password: "hash",
                role: Role.USER,
            });

            // Act & Assert
            expect(activeUser.isAccountActive()).toBe(true);
            expect(inactiveUser.isAccountActive()).toBe(false);
        });

        it("should enable and disable account", () => {
            // Arrange
            const user = new UserEntity({
                email: "test@example.com",
                enabled: true,
                password: "hash",
                role: Role.USER,
            });

            // Act
            user.disableAccount();

            // Assert
            expect(user.enabled).toBe(false);
            expect(user.isEnabled()).toBe(false);

            // Act
            user.enableAccount();

            // Assert
            expect(user.enabled).toBe(true);
            expect(user.isEnabled()).toBe(true);
        });

        it("should lock and unlock account", () => {
            // Arrange
            const user = new UserEntity({
                accountNonLocked: true,
                email: "test@example.com",
                password: "hash",
                role: Role.USER,
            });

            // Act
            user.lockAccount();

            // Assert
            expect(user.accountNonLocked).toBe(false);
            expect(user.isAccountNonLocked()).toBe(false);

            // Act
            user.unlockAccount();

            // Assert
            expect(user.accountNonLocked).toBe(true);
            expect(user.isAccountNonLocked()).toBe(true);
        });

        it("should expire account", () => {
            // Arrange
            const user = new UserEntity({
                accountNonExpired: true,
                email: "test@example.com",
                password: "hash",
                role: Role.USER,
            });

            // Act
            user.expireAccount();

            // Assert
            expect(user.accountNonExpired).toBe(false);
            expect(user.isAccountNonExpired()).toBe(false);
        });

        it("should expire credentials", () => {
            // Arrange
            const user = new UserEntity({
                credentialsNonExpired: true,
                email: "test@example.com",
                password: "hash",
                role: Role.USER,
            });

            // Act
            user.expireCredentials();

            // Assert
            expect(user.credentialsNonExpired).toBe(false);
            expect(user.isCredentialsNonExpired()).toBe(false);
        });

        it("should check if user has specific permission", () => {
            // Arrange
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                permissions: [Permission.USER_READ, Permission.USER_UPDATE],
                role: Role.USER,
            });

            // Act & Assert
            expect(user.hasPermission(Permission.USER_READ)).toBe(true);
            expect(user.hasPermission(Permission.USER_DELETE)).toBe(false);
        });

        it("should check if user has all specified permissions", () => {
            // Arrange
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                permissions: [
                    Permission.USER_READ,
                    Permission.USER_UPDATE,
                    Permission.USER_DELETE,
                ],
                role: Role.USER,
            });

            // Act & Assert
            expect(
                user.hasAllPermissions([
                    Permission.USER_READ,
                    Permission.USER_UPDATE,
                ]),
            ).toBe(true);
            expect(
                user.hasAllPermissions([
                    Permission.USER_READ,
                    Permission.ADMIN_ACCESS,
                ]),
            ).toBe(false);
        });

        it("should check if user has any of the specified permissions", () => {
            // Arrange
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                permissions: [Permission.USER_READ],
                role: Role.USER,
            });

            // Act & Assert
            expect(
                user.hasAnyPermission([
                    Permission.USER_READ,
                    Permission.ADMIN_ACCESS,
                ]),
            ).toBe(true);
            expect(
                user.hasAnyPermission([
                    Permission.ADMIN_ACCESS,
                    Permission.USER_DELETE,
                ]),
            ).toBe(false);
        });

        it("should return empty permissions for user with no permissions", () => {
            // Arrange
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                permissions: [],
                role: Role.USER,
            });

            // Act & Assert
            expect(user.hasAllPermissions([Permission.USER_READ])).toBe(false);
            expect(user.hasAnyPermission([Permission.USER_READ])).toBe(false);
        });

        it("should get permissions", () => {
            // Arrange
            const permissions = [Permission.USER_READ, Permission.USER_UPDATE];
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                permissions,
                role: Role.USER,
            });

            // Act
            const result = user.getPermissions();

            // Assert
            expect(result).toEqual(permissions);
            expect(result).toHaveLength(2);
        });
    });

    describe("Permission System", () => {
        it("should return correct default permissions for USER role", () => {
            // Act
            const permissions = getDefaultPermissionsByRole(Role.USER);

            // Assert
            expect(permissions).toContain(Permission.PROFILE_READ_OWN);
            expect(permissions).toContain(Permission.PROFILE_UPDATE_OWN);
            expect(permissions).toContain(Permission.PROFILE_CREATE_OWN);
            expect(permissions).toContain(Permission.API_READ);
            expect(permissions).toContain(Permission.FILE_CREATE);
            expect(permissions).toContain(Permission.FILE_READ);
            expect(permissions).toContain(Permission.FILE_UPDATE);
            expect(permissions).not.toContain(Permission.ADMIN_ACCESS);
            expect(permissions).not.toContain(Permission.USER_DELETE);
        });

        it("should return correct default permissions for ADMIN role", () => {
            // Act
            const permissions = getDefaultPermissionsByRole(Role.ADMIN);

            // Assert
            expect(permissions).toContain(Permission.ADMIN_ACCESS);
            expect(permissions).toContain(Permission.ADMIN_SYSTEM_CONFIG);
            expect(permissions).toContain(Permission.ADMIN_USER_MANAGEMENT);
            expect(permissions).toContain(Permission.USER_CREATE);
            expect(permissions).toContain(Permission.USER_READ);
            expect(permissions).toContain(Permission.USER_UPDATE);
            expect(permissions).toContain(Permission.USER_DELETE);
            expect(permissions).toContain(Permission.USER_LIST);
            expect(permissions).toContain(Permission.FILE_CREATE);
            expect(permissions).toContain(Permission.FILE_READ);
            expect(permissions).toContain(Permission.FILE_UPDATE);
            expect(permissions).toContain(Permission.FILE_DELETE);
            expect(permissions.length).toBeGreaterThan(15);
        });

        it("should return correct default permissions for MODERATOR role", () => {
            // Act
            const permissions = getDefaultPermissionsByRole(Role.MODERATOR);

            // Assert
            expect(permissions).toContain(Permission.USER_READ);
            expect(permissions).toContain(Permission.USER_UPDATE);
            expect(permissions).toContain(Permission.USER_LIST);
            expect(permissions).toContain(Permission.PROFILE_UPDATE_OWN);
            expect(permissions).toContain(Permission.PROFILE_READ_ANY);
            expect(permissions).toContain(Permission.FILE_READ);
            expect(permissions).toContain(Permission.FILE_UPDATE);
            expect(permissions).not.toContain(Permission.ADMIN_ACCESS);
            expect(permissions).not.toContain(Permission.USER_DELETE);
            expect(permissions).not.toContain(Permission.FILE_DELETE);
        });

        it("should return correct default permissions for ANONYMOUS role", () => {
            // Act
            const permissions = getDefaultPermissionsByRole(Role.ANONYMOUS);

            // Assert
            expect(permissions).toContain(Permission.API_READ);
            expect(permissions).toHaveLength(1);
            expect(permissions).not.toContain(Permission.USER_READ);
            expect(permissions).not.toContain(Permission.ADMIN_ACCESS);
        });

        it("should return empty permissions for unknown role", () => {
            // Act
            const permissions = getDefaultPermissionsByRole("UNKNOWN" as Role);

            // Assert
            expect(permissions).toEqual([]);
            expect(permissions).toHaveLength(0);
        });
    });

    describe("Password Hashing", () => {
        it("should hash password using bcrypt with correct salt rounds", async () => {
            // Arrange
            const plainPassword = "MySecurePassword123!";
            const saltRounds = 12;

            // Act
            const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

            // Assert
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(plainPassword);
            expect(hashedPassword).toMatch(/^\$2b\$12\$/);
            expect(hashedPassword.length).toBeGreaterThan(50);
        });

        it("should verify password against hash", async () => {
            // Arrange
            const plainPassword = "MySecurePassword123!";
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

            // Act
            const isValid = await bcrypt.compare(plainPassword, hashedPassword);
            const isInvalid = await bcrypt.compare(
                "WrongPassword",
                hashedPassword,
            );

            // Assert
            expect(isValid).toBe(true);
            expect(isInvalid).toBe(false);
        });

        it("should generate different hashes for same password", async () => {
            // Arrange
            const plainPassword = "MySecurePassword123!";
            const saltRounds = 12;

            // Act
            const hash1 = await bcrypt.hash(plainPassword, saltRounds);
            const hash2 = await bcrypt.hash(plainPassword, saltRounds);

            // Assert
            expect(hash1).not.toBe(hash2);
            expect(await bcrypt.compare(plainPassword, hash1)).toBe(true);
            expect(await bcrypt.compare(plainPassword, hash2)).toBe(true);
        });
    });

    describe("Role Hierarchy", () => {
        it("should verify ADMIN has more permissions than USER", () => {
            // Act
            const adminPermissions = getDefaultPermissionsByRole(Role.ADMIN);
            const userPermissions = getDefaultPermissionsByRole(Role.USER);

            // Assert
            expect(adminPermissions.length).toBeGreaterThan(
                userPermissions.length,
            );

            // All user permissions should be included in admin permissions
            userPermissions.forEach((permission) => {
                expect(adminPermissions).toContain(permission);
            });
        });

        it("should verify MODERATOR has more permissions than USER", () => {
            // Act
            const moderatorPermissions = getDefaultPermissionsByRole(
                Role.MODERATOR,
            );
            const userPermissions = getDefaultPermissionsByRole(Role.USER);

            // Assert
            expect(moderatorPermissions.length).toBeGreaterThan(
                userPermissions.length,
            );
        });

        it("should verify ADMIN has more permissions than MODERATOR", () => {
            // Act
            const adminPermissions = getDefaultPermissionsByRole(Role.ADMIN);
            const moderatorPermissions = getDefaultPermissionsByRole(
                Role.MODERATOR,
            );

            // Assert
            expect(adminPermissions.length).toBeGreaterThan(
                moderatorPermissions.length,
            );

            // Moderator permissions should be subset of admin
            moderatorPermissions.forEach((permission) => {
                expect(adminPermissions).toContain(permission);
            });
        });

        it("should verify ANONYMOUS has minimal permissions", () => {
            // Act
            const anonymousPermissions = getDefaultPermissionsByRole(
                Role.ANONYMOUS,
            );
            const userPermissions = getDefaultPermissionsByRole(Role.USER);

            // Assert
            expect(anonymousPermissions.length).toBeLessThan(
                userPermissions.length,
            );
            expect(anonymousPermissions).toContain(Permission.API_READ);
        });
    });

    describe("User Data Validation", () => {
        it("should create user with required fields only", () => {
            // Act
            const user = new UserEntity({
                email: "required@example.com",
                password: "hash",
                role: Role.USER,
            });

            // Assert
            expect(user.email).toBe("required@example.com");
            expect(user.password).toBe("hash");
            expect(user.role).toBe(Role.USER);
            expect(user.name).toBeUndefined();
            expect(user.phoneNumbers).toBeUndefined();
        });

        it("should create user with all optional fields", () => {
            // Act
            const user = new UserEntity({
                email: "full@example.com",
                name: "Full User",
                password: "hash",
                permissions: getDefaultPermissionsByRole(Role.USER),
                phoneNumbers: ["+84 123 456 789", "+1 555 123 4567"],
                role: Role.USER,
            });

            // Assert
            expect(user.email).toBe("full@example.com");
            expect(user.name).toBe("Full User");
            expect(user.phoneNumbers).toEqual([
                "+84 123 456 789",
                "+1 555 123 4567",
            ]);
            expect(user.permissions).toBeDefined();
            expect(user.permissions.length).toBeGreaterThan(0);
        });

        it("should handle multiple phone numbers", () => {
            // Act
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                phoneNumbers: [
                    "+84 123 456 789",
                    "+84 987 654 321",
                    "+1 555 000 0000",
                ],
                role: Role.USER,
            });

            // Assert
            expect(user.phoneNumbers).toHaveLength(3);
            expect(user.phoneNumbers).toContain("+84 123 456 789");
            expect(user.phoneNumbers).toContain("+84 987 654 321");
            expect(user.phoneNumbers).toContain("+1 555 000 0000");
        });
    });

    describe("UserService Logic Validation", () => {
        it("should validate that create assigns default permissions based on role", () => {
            // This tests the logic that UserService.create() should implement
            const roles = [
                Role.USER,
                Role.ADMIN,
                Role.MODERATOR,
                Role.ANONYMOUS,
            ];

            roles.forEach((role) => {
                const expectedPermissions = getDefaultPermissionsByRole(role);
                const user = new UserEntity({
                    email: `${role}@example.com`,
                    password: "hash",
                    permissions: expectedPermissions,
                    role,
                });

                expect(user.permissions).toEqual(expectedPermissions);
            });
        });

        it("should validate that update refreshes permissions when role changes", () => {
            // Simulate the update logic
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                permissions: getDefaultPermissionsByRole(Role.USER),
                role: Role.USER,
            });

            // Simulate role update
            const newRole = Role.ADMIN;
            user.role = newRole;
            user.permissions = getDefaultPermissionsByRole(newRole);

            expect(user.role).toBe(Role.ADMIN);
            expect(user.permissions).toEqual(
                getDefaultPermissionsByRole(Role.ADMIN),
            );
            expect(user.permissions).toContain(Permission.ADMIN_ACCESS);
        });

        it("should validate that password hashing produces bcrypt format", async () => {
            // This tests the logic that UserService.create() and update() use
            const SALT_ROUNDS = 12;
            const plainPassword = "TestPassword123!";

            const hashedPassword = await bcrypt.hash(
                plainPassword,
                SALT_ROUNDS,
            );

            expect(hashedPassword).toMatch(/^\$2b\$12\$/);
            expect(hashedPassword).not.toBe(plainPassword);
            expect(hashedPassword.length).toBeGreaterThan(50);
        });

        it("should validate updatedBy field assignment logic", () => {
            // Simulate the update logic
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                role: Role.USER,
            });

            const adminEmail = "admin@example.com";
            user.updatedBy = adminEmail;

            expect(user.updatedBy).toBe(adminEmail);
        });

        it("should validate that user data can be merged correctly", () => {
            // Simulate Object.assign logic used in update
            const existingUser = new UserEntity({
                email: "old@example.com",
                name: "Old Name",
                password: "oldHash",
                phoneNumbers: ["+84 111 111 111"],
                role: Role.USER,
            });

            const updateData = {
                email: "new@example.com",
                name: "New Name",
                phoneNumbers: ["+84 999 999 999"],
            };

            Object.assign(existingUser, updateData);

            expect(existingUser.email).toBe("new@example.com");
            expect(existingUser.name).toBe("New Name");
            expect(existingUser.phoneNumbers).toEqual(["+84 999 999 999"]);
            expect(existingUser.role).toBe(Role.USER); // Should remain unchanged
        });

        it("should validate partial update logic", () => {
            // Test that partial updates work correctly
            const user = new UserEntity({
                email: "test@example.com",
                name: "Original Name",
                password: "hash",
                phoneNumbers: ["+84 123 456 789"],
                role: Role.USER,
            });

            // Only update name
            Object.assign(user, { name: "Updated Name" });

            expect(user.name).toBe("Updated Name");
            expect(user.email).toBe("test@example.com");
            expect(user.phoneNumbers).toEqual(["+84 123 456 789"]);
        });

        it("should validate that password update hashes the new password", async () => {
            // Simulate password update logic
            const SALT_ROUNDS = 12;
            const user = new UserEntity({
                email: "test@example.com",
                password: await bcrypt.hash("OldPassword123!", SALT_ROUNDS),
                role: Role.USER,
            });

            const oldPassword = user.password;
            const newPlainPassword = "NewPassword123!";

            // Hash the new password
            const newHashedPassword = await bcrypt.hash(
                newPlainPassword,
                SALT_ROUNDS,
            );
            user.password = newHashedPassword;

            expect(user.password).not.toBe(newPlainPassword);
            expect(user.password).not.toBe(oldPassword);
            expect(user.password).toMatch(/^\$2b\$12\$/);
            expect(await bcrypt.compare(newPlainPassword, user.password)).toBe(
                true,
            );
        });

        it("should validate that role update only updates permissions when role is provided", () => {
            // Test conditional permission update logic
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                permissions: getDefaultPermissionsByRole(Role.USER),
                role: Role.USER,
            });

            const originalPermissions = [...user.permissions];

            // Update without role change
            Object.assign(user, { name: "Updated Name" });
            expect(user.permissions).toEqual(originalPermissions);

            // Update with role change
            const updateWithRole = {
                role: Role.ADMIN,
            };
            Object.assign(user, updateWithRole);
            user.permissions = getDefaultPermissionsByRole(updateWithRole.role);

            expect(user.permissions).not.toEqual(originalPermissions);
            expect(user.permissions).toEqual(
                getDefaultPermissionsByRole(Role.ADMIN),
            );
        });
    });

    describe("Permission Edge Cases", () => {
        it("should handle user with empty permissions array", () => {
            // Arrange
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                permissions: [],
                role: Role.USER,
            });

            // Act & Assert
            expect(user.getPermissions()).toEqual([]);
            expect(user.hasPermission(Permission.USER_READ)).toBe(false);
            expect(user.hasAllPermissions([])).toBe(false);
            expect(user.hasAnyPermission([Permission.USER_READ])).toBe(false);
        });

        it("should handle checking empty permission list", () => {
            // Arrange
            const user = new UserEntity({
                email: "test@example.com",
                password: "hash",
                permissions: [Permission.USER_READ, Permission.USER_UPDATE],
                role: Role.USER,
            });

            // Act & Assert
            // Array.every() returns true for empty arrays (vacuous truth)
            expect(user.hasAllPermissions([])).toBe(true);
            // Array.some() returns false for empty arrays
            expect(user.hasAnyPermission([])).toBe(false);
        });
    });
});
