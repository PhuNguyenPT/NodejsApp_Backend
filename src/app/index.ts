// src/app/index.ts
import "reflect-metadata";
async function bootstrap() {
    try {
        // Import logger dynamically after reflect-metadata is loaded
        const { default: logger } = await import("@/util/logger.js");
        const { createSafeConfig } = await import("@/util/validate-env.js");
        logger.info("Starting application", createSafeConfig());
        // Dynamic import of App to ensure all dependencies are ready
        const { default: App } = await import("@/app/app.js");
        const app = new App();
        await app.initialize();
        logger.info(`Server will be available at: ${app.getServerUrl()}`);
        app.listen();
    } catch (error) {
        console.error("Error starting server:", error); // Use console.error as fallback
        process.exit(1);
    }
}
// Start the application
bootstrap().catch((error: unknown) => {
    console.error("Failed to bootstrap application:", error); // Use console.error here too
    process.exit(1);
});
