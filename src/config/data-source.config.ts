import type { LogLevel } from "typeorm";

import { DataSource } from "typeorm";

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

/**
 * Get entities path configuration based on environment
 */
const getEntitiesPath = (): string => {
    const srcPath = "src/entity/**/*.ts";
    const distPath = "dist/entity/**/*.js";
    switch (config.NODE_ENV) {
        case "development":
            return srcPath;
        case "production":
            return distPath;
        case "staging":
            return distPath;
        case "test":
            return distPath;
    }
};

/**
 * Get migration path configuration based on environment
 */
const getMigrationPath = (): string => {
    const srcPath = "src/migration/**/*.ts";
    const distPath = "dist/migration/**/*.js";
    switch (config.NODE_ENV) {
        case "development":
            return srcPath;
        case "production":
            return distPath;
        case "staging":
            return distPath;
        case "test":
            return distPath;
    }
};
// Redis configuration for TypeORM cache using ioredis
const typeormRedisConfig = {
    db: config.REDIS_DB,
    host: config.REDIS_HOST,
    password: config.REDIS_USER_PASSWORD,
    port: config.REDIS_PORT,
    username: config.REDIS_USERNAME,
} as const;

export const postgresDataSource = new DataSource({
    cache: {
        duration: 60 * 60 * 1000,
        options: typeormRedisConfig,
        tableName: "query_result_cache",
        type: "ioredis", // Changed from "redis" to "ioredis"
    },
    database: config.POSTGRES_DB,
    entities: [getEntitiesPath()],
    extra: {
        acquire: 30000,
        idle: 10000,
        max: 20,
        min: 5,
    },
    host: config.POSTGRES_HOST,
    logging: getLogging(),
    maxQueryExecutionTime: 5000,
    migrations: [getMigrationPath()],
    migrationsRun: config.DB_RUN_MIGRATIONS_ON_STARTUP,
    migrationsTableName: "typeorm_migrations",
    password: config.POSTGRES_PASSWORD,
    port: config.POSTGRES_PORT,
    subscribers: [],
    synchronize: config.DB_SYNCHRONIZE,
    type: "postgres",
    username: config.POSTGRES_USER,
});
