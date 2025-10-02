// src/util/jwt.options.ts
import { Algorithm, SignOptions, VerifyOptions } from "jsonwebtoken";
import { AuthenticateOptions } from "passport";
import { ExtractJwt, StrategyOptionsWithRequest } from "passport-jwt";

import { keyStore } from "@/util/key.js";
import { config } from "@/util/validate-env.js";

// Access Token Configuration (shorter lifespan for security)
export const JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS =
    config.JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS; // 1 hour
export const JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS =
    JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS * 1000;

// Refresh Token Configuration (longer lifespan)
export const JWT_REFRESH_TOKEN_EXPIRATION_SECONDS =
    config.JWT_REFRESH_TOKEN_EXPIRATION_IN_SECONDS; // 7 days

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
    expiresIn: JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS,
    issuer: strategyOptionsWithRequest.issuer,
};

export const refreshSignOptions: SignOptions = {
    algorithm: algorithm,
    audience: strategyOptionsWithRequest.audience,
    expiresIn: JWT_REFRESH_TOKEN_EXPIRATION_SECONDS,
    issuer: strategyOptionsWithRequest.issuer,
};

export const verifyOptions: VerifyOptions = {
    algorithms: algorithms,
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
