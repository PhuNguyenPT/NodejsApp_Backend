// src/config/validation.config.ts
import type { ValidatorOptions } from "class-validator";

/**
 * Default validator options for permissive validation.
 * Allows extra properties from entities while still validating decorated fields.
 */
export const DEFAULT_VALIDATOR_OPTIONS: ValidatorOptions = {
    forbidNonWhitelisted: false,
    skipMissingProperties: true,
    skipNullProperties: false,
    skipUndefinedProperties: false,
    stopAtFirstError: false,
    whitelist: false,
};
