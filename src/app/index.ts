// src/app/index.ts
import App from "@/app/app.js";
import swaggerDocs from "@/config/swagger.js";
import logger from "@/util/logger.js";
import validateEnv, { config } from "@/util/validate.env.js";

// Validate environment variables first
validateEnv();

// Log startup information
logger.info("Starting application", {
    CORS_CREDENTIALS: config.CORS_CREDENTIALS,
    CORS_ORIGIN: config.CORS_ORIGIN,
    NODE_ENV: config.NODE_ENV,
    POSTGRES_DB: config.POSTGRES_DB,
    POSTGRES_HOST: config.POSTGRES_HOST,
    POSTGRES_PORT: config.POSTGRES_PORT,
    SERVER_HOSTNAME: config.SERVER_HOSTNAME,
    SERVER_PATH: config.SERVER_PATH,
    SERVER_PORT: config.SERVER_PORT,
});

// Create the app with environment variables
const app = new App();

// Setup Swagger documentation in non-production environments BEFORE starting the server
if (process.env.NODE_ENV !== "production") {
    try {
        logger.info("Setting up Swagger documentation...");
        swaggerDocs(app.express, app.getServerUrl());
        logger.info("Swagger documentation setup completed");
    } catch (error) {
        logger.error("Error setting up Swagger documentation:", error);
        // Continue without Swagger if it fails
    }
}

// Log the complete server URL
logger.info(`Server will be available at: ${app.getServerUrl()}`);

// Start the server AFTER all routes are configured
try {
    app.listen();
} catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
}
