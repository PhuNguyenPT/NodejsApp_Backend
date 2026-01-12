import type { LogLevel } from "typeorm";
import type { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions.js";

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
        default:
            return srcPath;
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
        default:
            return srcPath;
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

// PostgreSQL DataSource configuration
const postgresConnectionOptions: PostgresConnectionOptions = {
    // Query result cache using Redis
    cache: {
        duration: 60 * 60 * 1000, // 1 hour
        options: typeormRedisConfig,
        tableName: "query_result_cache",
        type: "ioredis",
    },
    // PostgreSQL-specific connection timeout
    connectTimeoutMS: 10000, // 10 seconds max to establish connection
    database: config.POSTGRES_DB,
    // Entity and migration configuration
    entities: [getEntitiesPath()],
    // PostgreSQL connection pool options (pg driver options)
    extra: {
        idleTimeoutMillis: 10000, // 10 seconds idle timeout
        max: 20, // Maximum pool size
        min: 5, // Minimum pool size
    },
    host: config.POSTGRES_HOST,

    // Logging configuration
    logging: getLogging(),
    maxQueryExecutionTime: 5000,
    migrations: [getMigrationPath()],

    // Migration settings
    migrationsRun: config.DB_RUN_MIGRATIONS_ON_STARTUP,
    migrationsTableName: "typeorm_migrations",
    password: config.POSTGRES_PASSWORD,

    port: config.POSTGRES_PORT,
    subscribers: [],

    synchronize: config.DB_SYNCHRONIZE,

    type: "postgres",

    username: config.POSTGRES_USER,
};

export const postgresDataSource = new DataSource(postgresConnectionOptions);
