// src/util/validate.env.ts
import { bool, cleanEnv, makeValidator, port, str } from "envalid";

const commaSeparatedString = makeValidator((x) =>
    x.split(",").map((s) => s.trim()),
);

// Define the configuration interface
interface Config {
    CORS_CREDENTIALS: boolean;
    // CORS Configuration
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

    // Database config
    POSTGRES_DB: string;
    POSTGRES_HOST: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_PORT: number;
    POSTGRES_USER: string;

    // Application config
    SERVER_HOSTNAME: string;
    SERVER_PATH: string;
    SERVER_PORT: number;
}

// Validate and export the typed config object
export const config: Config = cleanEnv(process.env, {
    CORS_CREDENTIALS: bool({ default: true }), // Use bool validator

    // CORS Configuration
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

    // Database config
    POSTGRES_DB: str(),
    POSTGRES_HOST: str(),
    POSTGRES_PASSWORD: str(),
    POSTGRES_PORT: port({ default: 5432 }),
    POSTGRES_USER: str(),

    // Application config
    SERVER_HOSTNAME: str({ default: "localhost" }),
    SERVER_PATH: str({ default: "/api" }),
    SERVER_PORT: port({ default: 3000 }),
});

function validateEnv(): void {
    console.log("Environment validation completed");
}

export default validateEnv;
