// src/app/index.ts
import App from "@/app/app.js";
import logger from "@/util/logger.js";
import validateEnv, { config } from "@/util/validate.env.js";

async function bootstrap(): Promise<void> {
    try {
        // Validate environment variables first
        validateEnv();

        // Log startup information
        logger.info("Starting application", {
            ADMIN_EMAIL: config.ADMIN_EMAIL,
            ADMIN_NAME: config.ADMIN_NAME,

            CORS_CREDENTIALS: config.CORS_CREDENTIALS,
            CORS_ORIGIN: config.CORS_ORIGIN,
            DB_LOGGING: config.DB_LOGGING,
            DB_RUN_MIGRATIONS_ON_STARTUP: config.DB_RUN_MIGRATIONS_ON_STARTUP,

            DB_SYNCHRONIZE: config.DB_SYNCHRONIZE,

            ENABLE_FILE_LOGGING: config.ENABLE_FILE_LOGGING,
            JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS:
                config.JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS,

            JWT_REFRESH_TOKEN_EXPIRATION_IN_SECONDS:
                config.JWT_REFRESH_TOKEN_EXPIRATION_IN_SECONDS,
            LOG_DIR: config.LOG_DIR,

            LOG_LEVEL: config.LOG_LEVEL,

            NODE_ENV: config.NODE_ENV,
            PAGINATION_DEFAULT_PAGE: config.PAGINATION_DEFAULT_PAGE,
            PAGINATION_DEFAULT_SIZE: config.PAGINATION_DEFAULT_SIZE,
            PAGINATION_MAX_SIZE: config.PAGINATION_MAX_SIZE,

            PAGINATION_MIN_SIZE: config.PAGINATION_MIN_SIZE,
            POSTGRES_DB: config.POSTGRES_DB,
            POSTGRES_HOST: config.POSTGRES_HOST,
            POSTGRES_PORT: config.POSTGRES_PORT,

            POSTGRES_USER: config.POSTGRES_USER,
            PRIVATE_KEY_PATH: config.PRIVATE_KEY_PATH,

            PUBLIC_KEY_PATH: config.PUBLIC_KEY_PATH,
            REDIS_DB: config.REDIS_DB,
            REDIS_HOST: config.REDIS_HOST,
            REDIS_PORT: config.REDIS_PORT,
            REDIS_USERNAME: config.REDIS_USERNAME,

            SERVER_HOSTNAME: config.SERVER_HOSTNAME,
            SERVER_PATH: config.SERVER_PATH,
            SERVER_PORT: config.SERVER_PORT,

            SERVICE_SERVER_HOSTNAME: config.SERVICE_SERVER_HOSTNAME,
            SERVICE_SERVER_PATH: config.SERVICE_SERVER_PATH,
            SERVICE_SERVER_PORT: config.SERVICE_SERVER_PORT,
        });

        // Create the app (synchronous - no database connection yet)
        const app = new App();

        // Initialize async components (database connection, etc.)
        await app.initialize();

        // Log the complete server URL
        logger.info(`Server will be available at: ${app.getServerUrl()}`);

        // Start the server AFTER initialization is complete
        app.listen();
    } catch (error) {
        logger.error("Error starting server:", error);
        process.exit(1);
    }
}

// Start the application
bootstrap().catch((error: unknown) => {
    logger.error("Failed to bootstrap application:", error);
    process.exit(1);
});
