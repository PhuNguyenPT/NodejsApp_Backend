// src/app/index.ts
import App from "@/app/app.js";
import logger from "@/util/logger.js";
import validateEnv, { config } from "@/util/validate.env.js";

// Validate environment variables first
validateEnv();

// Log startup information
logger.info("Starting application", {
    CORS_CREDENTIALS: config.CORS_CREDENTIALS,
    CORS_ORIGIN: config.CORS_ORIGIN,
    NODE_ENV: config.NODE_ENV,
    PAGINATION_DEFAULT_PAGE: config.PAGINATION_DEFAULT_PAGE,
    PAGINATION_DEFAULT_SIZE: config.PAGINATION_DEFAULT_SIZE,
    PAGINATION_MAX_SIZE: config.PAGINATION_MAX_SIZE,
    PAGINATION_MIN_SIZE: config.PAGINATION_MIN_SIZE,
    POSTGRES_DB: config.POSTGRES_DB,
    POSTGRES_HOST: config.POSTGRES_HOST,
    POSTGRES_PORT: config.POSTGRES_PORT,
    PRIVATE_KEY_PATH: config.PRIVATE_KEY_PATH,
    PUBLIC_KEY_PATH: config.PUBLIC_KEY_PATH,
    SERVER_HOSTNAME: config.SERVER_HOSTNAME,
    SERVER_PATH: config.SERVER_PATH,
    SERVER_PORT: config.SERVER_PORT,
});

// Create the app with environment variables
const app = new App();

// Log the complete server URL
logger.info(`Server will be available at: ${app.getServerUrl()}`);

// Start the server AFTER all routes are configured
try {
    app.listen();
} catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
}
