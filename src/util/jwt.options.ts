// src/util/jwt.options.ts
import { Algorithm, SignOptions, VerifyOptions } from "jsonwebtoken";
import { AuthenticateOptions } from "passport";
import { ExtractJwt, StrategyOptionsWithRequest } from "passport-jwt";

import { keyStore } from "@/util/key.js";

export const JWT_EXPIRATION_TIME_IN_SECONDS = 86400;
export const JWT_MAX_AGE_IN_MILLISECONDS = 3600000;

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
    passReqToCallback: true, // Enable request object in callback
    secretOrKey: keyStore.publicKey,
};

export const signOptions: SignOptions = {
    algorithm: algorithm,
    audience: strategyOptionsWithRequest.audience,
    expiresIn: JWT_EXPIRATION_TIME_IN_SECONDS,
    issuer: strategyOptionsWithRequest.issuer,
};

export const verifyOptions: VerifyOptions = {
    algorithms: algorithms,
    audience: strategyOptionsWithRequest.audience,
    ignoreExpiration: false,
    issuer: strategyOptionsWithRequest.issuer,
    maxAge: JWT_MAX_AGE_IN_MILLISECONDS, // ✅ 1 hour in ms
};

export const authenticateOptions: AuthenticateOptions = {
    failureFlash: false,
    failureRedirect: undefined,
    session: false,
    successFlash: false,
    successMessage: false,
    successRedirect: undefined,
};
