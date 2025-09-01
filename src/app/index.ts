// src/app/index.ts
import App from "@/app/app.js";
import logger from "@/util/logger.js";
import { createSafeConfig } from "@/util/validate.env.js";

async function bootstrap(): Promise<void> {
    try {
        // Log startup information
        logger.info("Starting application", createSafeConfig());

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
