// src/config/data.source.config.ts
import { DataSource } from "typeorm";

import { redisConfig } from "@/config/redis.config.js";
import { config } from "@/util/validate-env.js";

export const postgresDataSource = new DataSource({
    cache: {
        // Enable caching by default for all queries (optional)
        alwaysEnabled: false, // Set to true if you want all queries cached by default
        // Default cache duration (1 hour)
        duration: 60 * 60 * 1000, // 1 hour in milliseconds
        // Ignore cache errors and continue with database queries
        ignoreErrors: true,
        options: redisConfig,
        // Cache table name for fallback database caching
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
    logging: config.DB_LOGGING,
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
