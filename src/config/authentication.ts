import express from "express";
import passport from "passport";

// src/config/authentication.ts
import { CustomJwtPayload } from "@/service/jwt.service";

/**
 * TSOA Authentication function for Express.
 * This function is called by the TSOA runtime for each secured route.
 */
export function expressAuthentication(
    request: express.Request,
    securityName: string,
    scopes?: string[],
): Promise<CustomJwtPayload> {
    return new Promise((resolve, reject) => {
        if (securityName === "bearerAuth") {
            const customCallback = (
                err: Error | null,
                user: Express.User | false,
                info: unknown,
            ) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!user) {
                    if (info instanceof Error) {
                        reject(info);
                    }
                    const message = "Unauthorized";
                    reject(new Error(message));
                    return;
                }

                // --- KEY CHANGE ---
                // Attach the user to the request object so it's available in controllers via @Request()
                request.user = user;

                // Optional: Scope checking can be performed here
                if (scopes && scopes.length > 0) {
                    console.log(
                        "Scope check required, but not yet implemented:",
                        scopes,
                    );
                }

                // Resolve the promise to signal to TSOA that authentication was successful
                resolve(user);
            };

            const authenticator = passport.authenticate(
                "jwt",
                { session: false },
                customCallback,
            ) as (req: express.Request) => void;

            authenticator(request);
        } else {
            reject(new Error(`Unknown security type: ${securityName}`));
        }
    });
}
