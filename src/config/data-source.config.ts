import type { LogLevel } from "typeorm";

import { DataSource } from "typeorm";

import { redisConfig } from "@/config/redis.config.js";
import { config } from "@/util/validate-env.js";

/**
 * Get logging configuration based on environment and configuration
 */
const getLogging = (): boolean | LogLevel[] => {
    if (!config.DB_LOGGING) {
        return false;
    }

    // If custom levels are specified, use them
    if (config.DB_LOGGING_LEVELS) {
        const levels = config.DB_LOGGING_LEVELS.split(",").map(
            (s) => s.trim() as LogLevel,
        );

        return levels.length > 0 ? levels : false;
    }

    // Otherwise, auto-detect based on NODE_ENV
    switch (config.NODE_ENV) {
        case "development":
            return [
                "query",
                "error",
                "warn",
                "info",
                "log",
                "schema",
                "migration",
            ];

        case "production":
            return ["error", "warn"];

        case "staging":
            return ["query", "error", "warn", "info"];

        default:
            return false;
    }
};

export const postgresDataSource = new DataSource({
    cache: {
        alwaysEnabled: false,
        duration: 60 * 60 * 1000,
        ignoreErrors: true,
        options: redisConfig,
        tableName: "query_result_cache",
        type: "redis",
    },
    database: config.POSTGRES_DB,
    entities: [
        config.NODE_ENV === "development"
            ? "src/entity/**/*.ts"
            : "dist/entity/**/*.js",
    ],
    extra: {
        acquire: 30000,
        idle: 10000,
        max: 20,
        min: 5,
    },
    host: config.POSTGRES_HOST,
    logging: getLogging(),
    maxQueryExecutionTime: 5000,
    migrations: [
        config.NODE_ENV === "development"
            ? "src/migration/**/*.ts"
            : "dist/migration/**/*.js",
    ],
    migrationsRun: config.DB_RUN_MIGRATIONS_ON_STARTUP,
    migrationsTableName: "typeorm_migrations",
    password: config.POSTGRES_PASSWORD,
    port: config.POSTGRES_PORT,
    subscribers: [],
    synchronize: config.DB_SYNCHRONIZE,
    type: "postgres",
    username: config.POSTGRES_USER,
});
