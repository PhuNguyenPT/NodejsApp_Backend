// src/type/enum/user.ts
export enum Permission {
    // Admin functions
    ADMIN_ACCESS = "admin:access",
    ADMIN_SYSTEM_CONFIG = "admin:system:config",
    ADMIN_USER_MANAGEMENT = "admin:user:management",

    // API access
    API_DELETE = "api:delete",
    API_READ = "api:read",
    API_WRITE = "api:write",

    // File management - ADD THESE
    FILE_CREATE = "file:create",
    FILE_DELETE = "file:delete",
    FILE_READ = "file:read",
    FILE_UPDATE = "file:update",

    // Profile management
    PROFILE_CREATE_OWN = "profile:create:own",
    PROFILE_READ_ANY = "profile:read:any",
    PROFILE_READ_OWN = "profile:read:own",
    PROFILE_UPDATE_ANY = "profile:update:any",
    PROFILE_UPDATE_OWN = "profile:update:own",

    // User management
    USER_CREATE = "user:create",
    USER_DELETE = "user:delete",
    USER_LIST = "user:list",
    USER_READ = "user:read",
    USER_UPDATE = "user:update",
}

export enum Role {
    ADMIN = "admin",
    ANONYMOUS = "anonymous",
    MODERATOR = "moderator",
    USER = "user",
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
                Permission.PROFILE_READ_OWN,
                Permission.PROFILE_UPDATE_OWN,
                Permission.PROFILE_CREATE_OWN,
                Permission.PROFILE_UPDATE_ANY,
                Permission.PROFILE_READ_ANY,
                Permission.ADMIN_ACCESS,
                Permission.ADMIN_SYSTEM_CONFIG,
                Permission.ADMIN_USER_MANAGEMENT,
                Permission.API_READ,
                Permission.API_WRITE,
                Permission.API_DELETE,
                // Add file permissions for admin
                Permission.FILE_CREATE,
                Permission.FILE_READ,
                Permission.FILE_UPDATE,
                Permission.FILE_DELETE,
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
                // Add some file permissions for moderator
                Permission.FILE_READ,
                Permission.FILE_UPDATE,
            ];
        case Role.USER:
            return [
                Permission.PROFILE_READ_OWN,
                Permission.PROFILE_UPDATE_OWN,
                Permission.PROFILE_CREATE_OWN,
                Permission.API_READ,
                // Add file permissions for user
                Permission.FILE_CREATE,
                Permission.FILE_READ,
                Permission.FILE_UPDATE,
            ];
        default:
            // Fallback to most restrictive permissions
            return [];
    }
}
