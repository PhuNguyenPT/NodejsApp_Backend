// src/util/jwt.options.ts
import { Algorithm, SignOptions, VerifyOptions } from "jsonwebtoken";
import { AuthenticateOptions } from "passport";
import { ExtractJwt, StrategyOptionsWithRequest } from "passport-jwt";

import { keyStore } from "@/util/key.js";

// Access Token Configuration (shorter lifespan for security)
export const ACCESS_TOKEN_EXPIRATION_SECONDS = 3600; // 1 hour
export const ACCESS_TOKEN_EXPIRATION_MS =
    ACCESS_TOKEN_EXPIRATION_SECONDS * 1000;

// Refresh Token Configuration (longer lifespan)
export const REFRESH_TOKEN_EXPIRATION_SECONDS = 604800; // 7 days

// Legacy export for backward compatibility (if needed elsewhere)
export const JWT_EXPIRATION_TIME_IN_SECONDS = ACCESS_TOKEN_EXPIRATION_SECONDS;
export const JWT_MAX_AGE_IN_MILLISECONDS = ACCESS_TOKEN_EXPIRATION_MS;

const algorithms: Algorithm[] = ["RS384"];
const algorithm: Algorithm = "RS384";

export const strategyOptionsWithRequest: StrategyOptionsWithRequest & {
    audience: string;
    issuer: string;
} = {
    algorithms: algorithms,
    audience: "your-app-users",
    ignoreExpiration: false,
    issuer: "your-app-name",
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    passReqToCallback: true,
    secretOrKey: keyStore.publicKey,
};

export const signOptions: SignOptions = {
    algorithm: algorithm,
    audience: strategyOptionsWithRequest.audience,
    expiresIn: ACCESS_TOKEN_EXPIRATION_SECONDS,
    issuer: strategyOptionsWithRequest.issuer,
};

export const refreshSignOptions: SignOptions = {
    algorithm: algorithm,
    audience: strategyOptionsWithRequest.audience,
    expiresIn: REFRESH_TOKEN_EXPIRATION_SECONDS,
    issuer: strategyOptionsWithRequest.issuer,
};

export const verifyOptions: VerifyOptions = {
    algorithms: algorithms,
    audience: strategyOptionsWithRequest.audience,
    ignoreExpiration: false,
    issuer: strategyOptionsWithRequest.issuer,
    maxAge: ACCESS_TOKEN_EXPIRATION_MS, // Now matches access token expiration
};

export const authenticateOptions: AuthenticateOptions = {
    failureFlash: false,
    failureRedirect: undefined,
    session: false,
    successFlash: false,
    successMessage: false,
    successRedirect: undefined,
};
