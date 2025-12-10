// src/util/jwt.options.ts
import type { Algorithm, SignOptions, VerifyOptions } from "jsonwebtoken";
import type { AuthenticateOptions } from "passport";

import { ExtractJwt, type StrategyOptionsWithRequest } from "passport-jwt";

import { keyStore } from "@/config/key.config.js";
import { config } from "@/util/validate-env.js";

export const JWT_ISSUER = config.JWT_ISSUER;
export const JWT_AUDIENCE = config.JWT_AUDIENCE;

// Access Token Configuration (shorter lifespan for security)
export const JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS =
    config.JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS; // 1 hour
export const JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS =
    JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS * 1000;

// Refresh Token Configuration (longer lifespan)
export const JWT_REFRESH_TOKEN_EXPIRATION_SECONDS =
    config.JWT_REFRESH_TOKEN_EXPIRATION_IN_SECONDS; // 7 days

const ALGORITHMS: Algorithm[] = ["RS384"];
const ALGORITHM: Algorithm = "RS384";

export const strategyOptionsWithRequest: StrategyOptionsWithRequest & {
    audience: string;
    issuer: string;
} = {
    algorithms: ALGORITHMS,
    audience: JWT_AUDIENCE,
    ignoreExpiration: false,
    issuer: JWT_ISSUER,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    passReqToCallback: true,
    secretOrKey: keyStore.publicKey,
};

export const signOptions: SignOptions = {
    algorithm: ALGORITHM,
    audience: strategyOptionsWithRequest.audience,
    expiresIn: JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS,
    issuer: strategyOptionsWithRequest.issuer,
};

export const refreshSignOptions: SignOptions = {
    algorithm: ALGORITHM,
    audience: strategyOptionsWithRequest.audience,
    expiresIn: JWT_REFRESH_TOKEN_EXPIRATION_SECONDS,
    issuer: strategyOptionsWithRequest.issuer,
};

export const verifyOptions: VerifyOptions = {
    algorithms: ALGORITHMS,
    audience: strategyOptionsWithRequest.audience,
    ignoreExpiration: false,
    issuer: strategyOptionsWithRequest.issuer,
    maxAge: JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS, // Now matches access token expiration
};

export const authenticateOptions: AuthenticateOptions = {
    failureFlash: false,
    failureRedirect: undefined,
    session: false,
    successFlash: false,
    successMessage: false,
    successRedirect: undefined,
};
