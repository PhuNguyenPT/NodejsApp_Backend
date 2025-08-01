// src/config/authentication.ts - Updated version
import type { AuthenticateCallback } from "passport";

import express from "express";
import passport from "passport";

import { Permission } from "@/type/enum/user";
import { AccessDeniedException } from "@/type/exception/access.denied.exception";
import { AuthenticationException } from "@/type/exception/authentication.exception";
import { ExpiredJwtException } from "@/type/exception/expired.jwt.exception";
import { JwtException } from "@/type/exception/jwt.exception";
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
            reject(
                new AuthenticationException(
                    `Unknown security type: ${securityName}`,
                ),
            );
            return;
        }

        try {
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
        } catch (error) {
            // Convert any unexpected errors to AuthenticationException
            const authError =
                error instanceof Error
                    ? new AuthenticationException(error.message)
                    : new AuthenticationException("Authentication failed");
            reject(authError);
        }
    });
}

/**
 * Create appropriate authentication error based on the error/info received
 */
function createAuthenticationError(errorOrInfo: unknown): Error {
    if (errorOrInfo instanceof Error) {
        // Parse common JWT error messages to throw appropriate exceptions
        const infoLower = errorOrInfo.message.toLowerCase();

        if (infoLower.includes("expired") || infoLower.includes("exp")) {
            return new ExpiredJwtException(errorOrInfo.message);
        } else if (
            infoLower.includes("no auth token") ||
            infoLower.includes("missing token")
        ) {
            return new AuthenticationException(
                "Authentication token is required",
            );
        } else if (
            infoLower.includes("invalid signature") ||
            infoLower.includes("signature")
        ) {
            return new JwtException("Invalid token signature");
        } else if (
            infoLower.includes("malformed") ||
            infoLower.includes("invalid token format")
        ) {
            return new JwtException("Malformed token");
        } else if (
            infoLower.includes("invalid algorithm") ||
            infoLower.includes("algorithm")
        ) {
            return new JwtException("Invalid token algorithm");
        } else if (
            infoLower.includes("invalid") ||
            infoLower.includes("token")
        ) {
            return new JwtException(errorOrInfo.message);
        } else {
            return new AuthenticationException(errorOrInfo.message);
        }
    } else if (Array.isArray(errorOrInfo) && errorOrInfo.length > 0) {
        const message = errorOrInfo.filter(Boolean).join(", ");
        return new AuthenticationException(message);
    } else {
        // Default case - no specific info provided
        return new AuthenticationException("Authentication failed");
    }
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
    return (err, user, info) => {
        try {
            // Handle authentication errors (network issues, malformed requests, etc.)
            if (err) {
                // Convert generic errors to appropriate authentication exceptions
                const authError = createAuthenticationError(err);
                reject(authError);
                return;
            }

            // Handle cases where authentication failed (no user returned)
            if (!user) {
                const authError = createAuthenticationError(info);
                reject(authError);
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
                    reject(
                        new AccessDeniedException(
                            `Insufficient permissions: ${message}`,
                        ),
                    );
                    return;
                }
            }

            resolve(user);
        } catch (error) {
            // Catch any unexpected errors in the callback itself
            const authError =
                error instanceof Error
                    ? new AuthenticationException(error.message)
                    : new AuthenticationException(
                          "Authentication callback failed",
                      );
            reject(authError);
        }
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
 * Validate user permissions (scopes) - IMPROVED VERSION
 */
function validateScopes(
    user: Express.User,
    requiredScopes: string[],
): { isValid: boolean; message?: string } {
    // Check if any required scopes are unknown/invalid
    const invalidScopes = requiredScopes.filter(
        (scope) => !Object.values(Permission).includes(scope as Permission),
    );

    if (invalidScopes.length > 0) {
        return {
            isValid: false,
            message: `Unknown permissions: ${invalidScopes.join(", ")}`,
        };
    }

    // Convert string scopes to Permission enum values
    const requiredPermissions = requiredScopes as Permission[];

    // If no permissions required, allow access
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
