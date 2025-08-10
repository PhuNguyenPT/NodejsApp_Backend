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
    DB_SYNCHRONIZE: boolean;

    // Logging settings
    ENABLE_FILE_LOGGING: boolean;
    LOG_DIR: string;
    LOG_LEVEL: "debug" | "error" | "http" | "info" | "warn";

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
    REDIS_TTL: number;
    REDIS_USER_PASSWORD?: string;
    REDIS_USERNAME?: string;

    // Migration settings
    RUN_MIGRATIONS_ON_STARTUP: boolean;
    // Application config
    SERVER_HOSTNAME: string;
    SERVER_PATH: string;
    SERVER_PORT: number;
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
    DB_SYNCHRONIZE: bool({ default: false }),

    // Logging settings
    ENABLE_FILE_LOGGING: bool({ default: false }),
    LOG_DIR: str({ default: "logs" }),
    LOG_LEVEL: str({
        choices: ["error", "warn", "info", "http", "debug"],
        default: "info",
    }),

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
    REDIS_TTL: num({ default: 3600 }),
    REDIS_USER_PASSWORD: str({ default: undefined }),
    REDIS_USERNAME: str({ default: undefined }),

    // Migration settings
    RUN_MIGRATIONS_ON_STARTUP: bool({ default: false }),

    // Application config
    SERVER_HOSTNAME: str({ default: "localhost" }),
    SERVER_PATH: str({ default: "/api" }),
    SERVER_PORT: port({ default: 3000 }),
});

function validateEnv(): void {
    console.info("Environment validation completed");
}

export default validateEnv;
