// src/config/data.source.ts
import { DataSource } from "typeorm";

import { redisConfig } from "@/config/redis.js";
import logger from "@/util/logger.js";
import { config } from "@/util/validate.env.js";

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
        config.NODE_ENV === "development" || config.NODE_ENV === "staging"
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
        config.NODE_ENV === "development" || config.NODE_ENV === "staging"
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

export const initializePostgreSQL = async (): Promise<void> => {
    logger.info("Connecting to PostgreSQL...");
    try {
        await postgresDataSource.initialize();
        logger.info("✅ PostgreSQL connection established successfully");

        // Test the connection
        await postgresDataSource.query("SELECT 1");
        logger.info("✅ PostgreSQL connection test passed");

        // Log entity metadata for debugging
        if (config.NODE_ENV === "development") {
            const entities = postgresDataSource.entityMetadatas;
            logger.info(
                `📊 Loaded ${entities.length.toString()} entities: ${entities.map((e) => e.name).join(", ")}`,
            );
        }
    } catch (error) {
        logger.error("❌ Failed to initialize PostgreSQL connection:", error);
        throw error;
    }
};
