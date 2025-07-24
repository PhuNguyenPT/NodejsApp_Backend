// src/util/jwt.options.ts
import { Algorithm, SignOptions, VerifyOptions } from "jsonwebtoken";
import { ExtractJwt, StrategyOptionsWithRequest } from "passport-jwt";

import { keyStore } from "@/util/key.js";

export const JWT_EXPIRATION_TIME_IN_SECONDS = 86400;
export const JWT_MAX_AGE_IN_MILLISECONDS = 3600000;

export const strategyOptionsWithRequest: StrategyOptionsWithRequest & {
    audience: string;
    issuer: string;
} = {
    algorithms: ["RS384"] as Algorithm[],
    audience: "your-app-users",
    ignoreExpiration: false,
    issuer: "your-app-name",
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    passReqToCallback: true, // Enable request object in callback
    secretOrKey: keyStore.publicKey,
};

export const signOptions: SignOptions = {
    algorithm: strategyOptionsWithRequest.algorithms?.[0] ?? "RS384",
    audience: strategyOptionsWithRequest.audience,
    expiresIn: JWT_EXPIRATION_TIME_IN_SECONDS,
    issuer: strategyOptionsWithRequest.issuer,
};

export const verifyOptions: VerifyOptions = {
    algorithms: strategyOptionsWithRequest.algorithms,
    audience: strategyOptionsWithRequest.audience,
    ignoreExpiration: false,
    issuer: strategyOptionsWithRequest.issuer,
    maxAge: JWT_MAX_AGE_IN_MILLISECONDS, // ✅ 1 hour in ms
};
