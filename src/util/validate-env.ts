import { bool, cleanEnv, makeValidator, num, port, str } from "envalid";

// src/util/validate.env.ts
import type { Config } from "@/config/app.config.js";

const commaSeparatedString = makeValidator((x) =>
    x.split(",").map((s) => s.trim()),
);

// Validate and export the typed config object
export const config: Config = cleanEnv(process.env, {
    ADMIN_EMAIL: str(),
    ADMIN_NAME: str(),
    ADMIN_PASSWORD: str(),

    // Cache TTL Configuration (in seconds)
    CACHE_TTL_ADMISSION_FIELDS_IN_SECONDS: num({ default: 1800 }), // 30 minutes
    CACHE_TTL_STUDENT_IN_SECONDS: num({ default: 3600 }), // 1h
    // CORS Configuration
    CORS_CREDENTIALS: bool({ default: true }), // Use bool validator
    CORS_ORIGIN: commaSeparatedString({ default: ["http://localhost:3000"] }),

    // Database connection settings
    DB_LOGGING: bool({ default: false }),
    DB_LOGGING_LEVELS: str({
        default: "",
        desc: "Comma-separated database log levels (query,error,warn,info,log,schema,migration). Empty = auto-detect based on NODE_ENV",
    }),
    // Migration settings
    DB_RUN_MIGRATIONS_ON_STARTUP: bool({ default: false }),

    DB_SYNCHRONIZE: bool({ default: false }),

    // Logging settings
    ENABLE_FILE_LOGGING: bool({ default: false }),

    FILE_SIZE: num({ default: 10485760 }),

    // JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: num({
        default: 3600, // 1 hour
    }),
    JWT_AUDIENCE: str({ default: "aud" }),
    JWT_ISSUER: str({ default: "iss" }),
    JWT_REFRESH_TOKEN_EXPIRATION_IN_SECONDS: num({
        default: 604800, // 7 days
    }),
    // Logging directory
    LOG_DIR: str({ default: "logs" }),

    LOG_LEVEL: str({
        choices: ["error", "warn", "info", "http", "debug"],
        default: "info",
    }),

    // Mistral AI API Configuration
    MISTRAL_API_KEY: str(),

    // Environment config
    NODE_ENV: str({
        choices: ["development", "production", "staging"],
    }),
    // Pagination Configuration (Spring Boot style)
    PAGINATION_DEFAULT_PAGE: num({ default: 1 }),
    PAGINATION_DEFAULT_SIZE: num({ default: 20 }),
    PAGINATION_MAX_SIZE: num({ default: 2000 }),

    PAGINATION_MIN_SIZE: num({ default: 1 }),
    // Database config
    POSTGRES_DB: str(),
    POSTGRES_HOST: str(),
    POSTGRES_PASSWORD: str(),
    POSTGRES_PORT: port({ default: 5432 }),

    POSTGRES_USER: str(),
    // JWT RSA Keys
    PRIVATE_KEY_PATH: str(),

    PUBLIC_KEY_PATH: str(),
    // Redis configuration
    REDIS_DB: num({ default: 0 }),
    REDIS_HOST: str({ default: "localhost" }),
    REDIS_PASSWORD: str({ default: undefined }),
    REDIS_PORT: port({ default: 6379 }),
    REDIS_USER_PASSWORD: str({ default: undefined }),

    REDIS_USERNAME: str({ default: undefined }),

    // Application config
    SERVER_BATCH_CONCURRENCY: num({ default: 5 }),
    SERVER_HOSTNAME: str({ default: "localhost" }),
    SERVER_PATH: str({ default: "/api" }),
    SERVER_PORT: port({ default: 3000 }),
    SERVER_TLS_PORT: port({ default: 3443 }),

    // Predict model service config
    SERVICE_BATCH_CONCURRENCY: num({ default: 3 }),
    SERVICE_INPUTS_PER_WORKER: num({ default: 3 }),
    SERVICE_L1_CHUNK_DELAY_MS: num({ default: 100 }),
    SERVICE_L1_CHUNK_SIZE_INPUT_ARRAY: num({ default: 10 }),
    SERVICE_L2_CHUNK_DELAY_MS: num({ default: 100 }),
    SERVICE_L2_CHUNK_SIZE_INPUT_ARRAY: num({ default: 3 }),
    SERVICE_MAX_RETRIES: num({ default: 2 }),
    SERVICE_MIN_BATCH_CONCURRENCY: num({ default: 1 }),
    SERVICE_NETWORK_LATENCY_MS: num({ default: 100 }),
    SERVICE_PREDICTION_CONCURRENCY: num({ default: 5 }),
    SERVICE_REQUEST_DELAY_MS: num({ default: 100 }),
    SERVICE_RETRY_BASE_DELAY_MS: num({ default: 2000 }),
    SERVICE_RETRY_ITERATION_DELAY_MS: num({ default: 1000 }),
    SERVICE_SERVER_HOSTNAME: str({ default: "localhost" }),
    SERVICE_SERVER_PATH: str({ default: "" }),
    SERVICE_SERVER_PORT: port({ default: 8000 }),
    SERVICE_TIMEOUT_IN_MS: num({ default: 90000 }),

    TLS_CA_PATH: str(),
    TLS_CERT_PATH: str(),
    TLS_KEY_PATH: str(),
});

// Function to create safe config object excluding sensitive password fields
export function createSafeConfig() {
    // Create a mutable copy by explicitly typing it as Config
    const safeConfig: Config = {
        ...config,
        // Override sensitive fields with placeholders during copy
        ADMIN_PASSWORD: "[HIDDEN]",
        MISTRAL_API_KEY: "[HIDDEN]",
        POSTGRES_PASSWORD: "[HIDDEN]",
        REDIS_PASSWORD: "[HIDDEN]",
        REDIS_USER_PASSWORD: "[HIDDEN]",
    };

    return safeConfig;
}
