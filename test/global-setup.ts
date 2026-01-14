// test/global-setup.ts
import "reflect-metadata";
import type { TestProject } from "vitest/node";

/**
 * GLOBAL SETUP - Runs ONCE in main process before ANY workers start
 *
 * This is where we run database migrations ONCE for all parallel workers.
 * Each worker will then connect to the already-initialized database.
 */
export default async function globalSetup(_project: TestProject) {
    console.log("🌍 Global Setup: Running ONE-TIME initialization...");

    try {
        // Import the data source
        const { postgresDataSource } = await import(
            "@/config/data-source.config.js"
        );

        console.log(
            "🌍 Global Setup: Initializing database and running migrations...",
        );

        // Initialize database - this runs migrations
        if (!postgresDataSource.isInitialized) {
            await postgresDataSource.initialize();
            console.log("✅ Global Setup: Database initialized successfully");
        }

        // IMPORTANT: Close this connection
        // Each worker will create its own connection
        await postgresDataSource.destroy();
        console.log("🌍 Global Setup: Closed pre-initialization connection");

        console.log("✅ Global Setup: Complete - workers can now start");

        // Return teardown function
        return () => {
            console.log("🌍 Global Teardown: Cleaning up...");
            // Cleanup happens here after all tests complete
        };
    } catch (error) {
        console.error("❌ Global Setup: Failed to initialize database:", error);
        throw error;
    }
}
