// src/config/validation.config.ts
import { ValidatorOptions } from "class-validator";

/**
 * Default validator options for permissive validation.
 * Allows extra properties from entities while still validating decorated fields.
 */
export const DEFAULT_VALIDATOR_OPTIONS: ValidatorOptions = {
    forbidNonWhitelisted: false, // Don't throw error for extra properties
    skipMissingProperties: false, // Still validate required properties
    skipNullProperties: false, // Validate null values
    skipUndefinedProperties: false, // Validate undefined values
    stopAtFirstError: false, // Get all errors
    whitelist: false, // Don't strip non-whitelisted properties
};
