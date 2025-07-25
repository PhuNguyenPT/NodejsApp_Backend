export enum Permission {
    // Admin functions
    ADMIN_ACCESS = "admin:access",
    ADMIN_SYSTEM_CONFIG = "admin:system:config",
    ADMIN_USER_MANAGEMENT = "admin:user:management",
    API_DELETE = "api:delete",
    // API access
    API_READ = "api:read",
    API_WRITE = "api:write",
    PROFILE_READ_ANY = "profile:read:any",
    PROFILE_UPDATE_ANY = "profile:update:any",
    // Profile management
    PROFILE_UPDATE_OWN = "profile:update:own",
    // User management
    USER_CREATE = "user:create",
    USER_DELETE = "user:delete",
    USER_LIST = "user:list",
    USER_READ = "user:read",
    USER_UPDATE = "user:update",
    // Add more permissions as needed for your application
}

// src/type/enum/user.ts
export enum Role {
    ADMIN = "ADMIN",
    ANONYMOUS = "ANONYMOUS",
    MODERATOR = "MODERATOR",
    USER = "USER",
}

export enum UserStatus {
    HAPPY = "Happy",
    SAD = "Sad",
}

// Helper function to get default permissions by role
export function getDefaultPermissionsByRole(role: Role): Permission[] {
    switch (role) {
        case Role.ADMIN:
            return [
                Permission.USER_CREATE,
                Permission.USER_READ,
                Permission.USER_UPDATE,
                Permission.USER_DELETE,
                Permission.USER_LIST,
                Permission.PROFILE_UPDATE_OWN,
                Permission.PROFILE_UPDATE_ANY,
                Permission.PROFILE_READ_ANY,
                Permission.ADMIN_ACCESS,
                Permission.ADMIN_SYSTEM_CONFIG,
                Permission.ADMIN_USER_MANAGEMENT,
                Permission.API_READ,
                Permission.API_WRITE,
                Permission.API_DELETE,
            ];
        case Role.ANONYMOUS:
            return [Permission.API_READ];
        case Role.MODERATOR:
            return [
                Permission.USER_READ,
                Permission.USER_UPDATE,
                Permission.USER_LIST,
                Permission.PROFILE_UPDATE_OWN,
                Permission.PROFILE_READ_ANY,
                Permission.API_READ,
                Permission.API_WRITE,
            ];
        case Role.USER:
            return [Permission.PROFILE_UPDATE_OWN, Permission.API_READ];
        default:
            // Fallback to most restrictive permissions
            return [];
    }
}
