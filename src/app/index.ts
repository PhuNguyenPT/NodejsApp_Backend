// src/app/index.ts
import "reflect-metadata";

import { logger } from "@/config/logger.config.js";
import { config, createSafeConfig } from "@/util/validate-env.js";

async function bootstrap() {
    try {
        logger.info("Starting application", createSafeConfig());

        // Dynamic import of App to ensure all dependencies are ready
        const { default: App } = await import("@/app/app.js");
        const app = new App(config);
        await app.initialize();

        logger.info(`Server will be available at: ${app.getServerUrl()}`);
        app.listen();
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

bootstrap().catch((error: unknown) => {
    console.error("Failed to bootstrap application:", error);
    process.exit(1);
});
