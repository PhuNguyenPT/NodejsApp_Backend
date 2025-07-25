// src/config/authentication.ts
import type { AuthenticateCallback } from "passport";

import express from "express";
import passport from "passport";

import { Permission } from "@/type/enum/user";
import { authenticateOptions } from "@/util/jwt.options";

// Define supported security types
const SECURITY_TYPES = {
    BEARER_AUTH: "bearerAuth",
    // Add more as needed: API_KEY: "apiKey", etc.
} as const;

type SecurityType = (typeof SECURITY_TYPES)[keyof typeof SECURITY_TYPES];

/**
 * TSOA Authentication function for Express.
 * This function is called by the TSOA runtime for each secured route.
 */
export function expressAuthentication(
    request: express.Request,
    securityName: string,
    scopes?: string[],
): Promise<Express.User> {
    return new Promise((resolve, reject) => {
        if (!isSupportedSecurityType(securityName)) {
            reject(new Error(`Unknown security type: ${securityName}`));
            return;
        }

        const customCallback = createJWTCallback(
            request,
            scopes,
            resolve,
            reject,
        );

        const authenticator = passport.authenticate(
            "jwt",
            authenticateOptions,
            customCallback,
        ) as (req: express.Request) => void;

        authenticator(request);
    });
}

/**
 * Create the callback function for JWT authentication using the default AuthenticateCallback type
 */
function createJWTCallback(
    request: express.Request,
    scopes: string[] | undefined,
    resolve: (value: Express.User) => void,
    reject: (reason: Error) => void,
): AuthenticateCallback {
    return (err, user, info, status) => {
        if (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
            return;
        }

        if (!user) {
            let error: Error;

            if (info instanceof Error) {
                error = info;
            } else if (typeof info === "string") {
                error = new Error(info);
            } else if (Array.isArray(info) && info.length > 0) {
                error = new Error(info.filter(Boolean).join(", "));
            } else {
                error = new Error("Unauthorized");
            }

            // Include status code if available
            if (status) {
                const statusCode = Array.isArray(status) ? status[0] : status;
                error.message += ` (Status: ${String(statusCode)})`;
            }

            reject(error);
            return;
        }

        // Attach user to request for controller access via @Request()
        request.user = user;

        // Handle scope validation if needed
        if (scopes && scopes.length > 0) {
            const scopeValidationResult = validateScopes(user, scopes);
            if (!scopeValidationResult.isValid) {
                const message =
                    scopeValidationResult.message ?? "Access denied";
                reject(new Error(`Insufficient permissions: ${message}`));
                return;
            }
        }

        resolve(user);
    };
}

/**
 * Type guard to check if security type is supported
 */
function isSupportedSecurityType(
    securityName: string,
): securityName is SecurityType {
    return Object.values(SECURITY_TYPES).includes(securityName as SecurityType);
}

/**
 * Validate user permissions (scopes)
 */
function validateScopes(
    user: Express.User,
    requiredScopes: string[],
): { isValid: boolean; message?: string } {
    // Convert string scopes to Permission enum values
    const requiredPermissions = requiredScopes.filter((scope) =>
        Object.values(Permission).includes(scope as Permission),
    ) as Permission[];

    // If no valid permissions required, allow access
    if (requiredPermissions.length === 0) {
        return { isValid: true };
    }

    // Check if user has permissions
    const userPermissions: Permission[] = user.permissions;

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(
            (permission) => !userPermissions.includes(permission),
        );

        return {
            isValid: false,
            message: `Missing permissions: ${missingPermissions.join(", ")}`,
        };
    }

    return { isValid: true };
}
