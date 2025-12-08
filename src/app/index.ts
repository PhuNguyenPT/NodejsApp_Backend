// src/app/index.ts
import "reflect-metadata";

import type App from "@/app/app.js";

import { logger } from "@/config/logger.config.js";
import { TYPES } from "@/type/container/types.js";
import { createSafeConfig } from "@/util/validate-env.js";

async function bootstrap() {
    try {
        logger.info("Starting application", createSafeConfig());

        const { iocContainer } = await import("@/app/ioc-container.js");

        const app = iocContainer.get<App>(TYPES.App);

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
