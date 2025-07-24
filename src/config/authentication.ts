import express from "express";
import passport from "passport";

import { authenticateOptions } from "@/util/jwt.options";
// src/config/authentication.ts
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
 * Create the callback function for JWT authentication
 */
function createJWTCallback(
    request: express.Request,
    scopes: string[] | undefined,
    resolve: (value: Express.User) => void,
    reject: (reason: Error) => void,
) {
    return (err: Error | null, user: Express.User | false, info: unknown) => {
        if (err) {
            reject(err);
            return;
        }

        if (!user) {
            const error =
                info instanceof Error ? info : new Error("Unauthorized");
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
 * Validate user scopes (implement based on your business logic)
 */
function validateScopes(
    user: Express.User,
    requiredScopes: string[],
): { isValid: boolean; message?: string } {
    // TODO: Implement actual scope validation logic
    // This is a placeholder - implement based on your user model and scope requirements

    const userId = user.id;
    const userRole = user.role;

    console.log("Scope validation required but not yet implemented:", {
        requiredScopes,
        userId,
        userRole,
    });

    // For now, always return valid - replace with actual logic
    return { isValid: true };

    // Example implementation might look like:
    // const userScopes = getUserScopes(user); // Get user's scopes/permissions
    // const hasAllScopes = requiredScopes.every(scope => userScopes.includes(scope));
    // return {
    //     isValid: hasAllScopes,
    //     message: hasAllScopes ? undefined : `Missing scopes: ${requiredScopes.join(', ')}`
    // };
}
