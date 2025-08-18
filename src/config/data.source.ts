// src/config/data.source.ts
import { DataSource } from "typeorm";

import logger from "@/util/logger.js";
import { config } from "@/util/validate.env.js";

export const postgresDataSource = new DataSource({
    cache: {
        options: {
            database: config.REDIS_DB,
            password: config.REDIS_USER_PASSWORD,
            socket: {
                host: config.REDIS_HOST,
                port: config.REDIS_PORT,
            },
            username: config.REDIS_USERNAME,
        },
        type: "redis",
    },
    database: config.POSTGRES_DB,
    // Use glob patterns - this is the correct approach to avoid circular dependencies
    // The index.ts file won't be loaded because it doesn't export any @Entity decorated classes
    entities: [
        config.NODE_ENV === "development" || config.NODE_ENV === "staging"
            ? "src/entity/**/*.ts"
            : "dist/entity/**/*.js",
    ],
    // Connection pool settings
    extra: {
        acquire: 30000,
        idle: 10000,
        max: 20, // Maximum connections
        min: 5, // Minimum connections
    },
    host: config.POSTGRES_HOST,
    logging: config.DB_LOGGING,
    // Additional optimization options
    maxQueryExecutionTime: 5000, // Log slow queries
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

// Initialize PostgreSQL connection
export const initializePostgreSQL = async (): Promise<void> => {
    logger.info("Connecting to PostgreSQL...");
    try {
        await postgresDataSource.initialize();
        logger.info("✅ PostgreSQL connection established successfully");

        // Test the connection with a simple query
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
