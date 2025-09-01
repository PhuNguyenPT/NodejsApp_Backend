// src/util/validate.env.ts
import { bool, cleanEnv, makeValidator, num, port, str } from "envalid";

const commaSeparatedString = makeValidator((x) =>
    x.split(",").map((s) => s.trim()),
);

// Define the configuration interface
interface Config {
    ADMIN_EMAIL: string;
    ADMIN_NAME: string;
    ADMIN_PASSWORD: string;

    // CORS Configuration
    CORS_CREDENTIALS: boolean;
    CORS_ORIGIN: string[];

    // Database connection settings
    DB_LOGGING: boolean;
    // Migration settings
    DB_RUN_MIGRATIONS_ON_STARTUP: boolean;

    DB_SYNCHRONIZE: boolean;

    // Logging settings
    ENABLE_FILE_LOGGING: boolean;
    // JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: number;

    JWT_REFRESH_TOKEN_EXPIRATION_IN_SECONDS: number;

    LOG_DIR: string;
    LOG_LEVEL: "debug" | "error" | "http" | "info" | "warn";

    // Mistral AI API Configuration
    MISTRAL_API_KEY: string;

    // Environment config
    NODE_ENV: "development" | "production" | "staging";
    // Pagination Configuration (Spring Boot style)
    PAGINATION_DEFAULT_PAGE: number;

    PAGINATION_DEFAULT_SIZE: number;
    PAGINATION_MAX_SIZE: number;
    PAGINATION_MIN_SIZE: number;
    // Database config
    POSTGRES_DB: string;
    POSTGRES_HOST: string;

    POSTGRES_PASSWORD: string;
    POSTGRES_PORT: number;

    POSTGRES_USER: string;
    // JWT RSA Keys
    PRIVATE_KEY_PATH: string;
    PUBLIC_KEY_PATH: string;
    // Redis configuration
    REDIS_DB: number;
    REDIS_HOST: string;
    REDIS_PASSWORD?: string;

    REDIS_PORT: number;
    REDIS_USER_PASSWORD?: string;

    REDIS_USERNAME?: string;

    // Application config
    SERVER_HOSTNAME: string;
    SERVER_PATH: string;
    SERVER_PORT: number;

    // Predict model service config
    SERVICE_BATCH_CONCURRENCY: number;
    SERVICE_MAX_RETRIES: number;
    SERVICE_PREDICTION_CONCURRENCY: number;
    SERVICE_REQUEST_DELAY_MS: number;
    SERVICE_RETRY_BASE_DELAY_MS: number;
    SERVICE_RETRY_ITERATION_DELAY_MS: number;
    SERVICE_SERVER_HOSTNAME: string;
    SERVICE_SERVER_PATH: string;
    SERVICE_SERVER_PORT: number;
}

// Validate and export the typed config object
export const config: Config = cleanEnv(process.env, {
    ADMIN_EMAIL: str(),
    ADMIN_NAME: str(),
    ADMIN_PASSWORD: str(),

    // CORS Configuration
    CORS_CREDENTIALS: bool({ default: true }), // Use bool validator
    CORS_ORIGIN: commaSeparatedString({ default: ["http://localhost:3000"] }),

    // Database connection settings
    DB_LOGGING: bool({ default: false }),
    // Migration settings
    DB_RUN_MIGRATIONS_ON_STARTUP: bool({ default: false }),

    DB_SYNCHRONIZE: bool({ default: false }),

    // Logging settings
    ENABLE_FILE_LOGGING: bool({ default: false }),
    // JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: num({
        default: 3600, // 1 hour
    }),

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
    SERVER_HOSTNAME: str({ default: "localhost" }),
    SERVER_PATH: str({ default: "/api" }),
    SERVER_PORT: port({ default: 3000 }),

    // Predict model service config
    SERVICE_BATCH_CONCURRENCY: num({ default: 3 }),
    SERVICE_MAX_RETRIES: num({ default: 2 }),
    SERVICE_PREDICTION_CONCURRENCY: num({ default: 5 }),
    SERVICE_REQUEST_DELAY_MS: num({ default: 100 }),
    SERVICE_RETRY_BASE_DELAY_MS: num({ default: 2000 }),
    SERVICE_RETRY_ITERATION_DELAY_MS: num({ default: 1000 }),
    SERVICE_SERVER_HOSTNAME: str({ default: "localhost" }),
    SERVICE_SERVER_PATH: str({ default: "" }),
    SERVICE_SERVER_PORT: port({ default: 8000 }),
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
