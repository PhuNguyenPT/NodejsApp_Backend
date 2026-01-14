// test/setup.ts
import "reflect-metadata";

import type AbstractApp from "@/app/app.abstract.js";

import { iocContainer } from "@/app/ioc-container.js";
import { postgresDataSource } from "@/config/data-source.config.js";
import { TYPES } from "@/type/container/types.js";

declare global {
    var __TEST_APP__: AbstractApp | undefined;
    var __TEST_INIT_PROMISE__: Promise<void> | undefined;
    var __TEST_SETUP_LOCK__: boolean | undefined;
}

/**
 * WORKER SETUP - Runs ONCE per worker thread
 *
 * IMPORTANT NOTES:
 * - globalSetup already ran migrations in the main process
 * - Each worker gets its own instance of this file
 * - The lock ensures this worker only initializes once
 * - Multiple test files in the same worker share this initialization
 */

// Get worker ID for debugging
const workerId = process.env.VITEST_WORKER_ID ?? "main";

if (!globalThis.__TEST_SETUP_LOCK__) {
    globalThis.__TEST_SETUP_LOCK__ = true;

    console.log(`🔧 Worker ${workerId}: Starting worker initialization...`);

    globalThis.__TEST_INIT_PROMISE__ = (async () => {
        try {
            const app = iocContainer.get<AbstractApp>(TYPES.App);

            console.log(
                `🔧 Worker ${workerId}: Initializing application components...`,
            );

            // Initialize app - connects to the database that was already
            // initialized in global-setup.ts (migrations already ran)
            await app.initialize();

            if (!postgresDataSource.isInitialized) {
                throw new Error("PostgreSQL DataSource failed to initialize");
            }

            const entityCount = postgresDataSource.entityMetadatas.length;
            console.log(
                `✅ Worker ${workerId}: Loaded ${entityCount.toString()} entity metadata entries`,
            );

            if (entityCount === 0) {
                throw new Error(
                    "No entities loaded - check TypeORM configuration",
                );
            }

            console.log(`✅ Worker ${workerId}: Ready to run tests`);

            globalThis.__TEST_APP__ = app;
        } catch (error) {
            console.error(
                `❌ Worker ${workerId}: Initialization failed:`,
                error,
            );
            throw error;
        }
    })();
} else {
    console.log(
        `🔧 Worker ${workerId}: Waiting for existing initialization...`,
    );
}

// Wait for initialization
if (globalThis.__TEST_INIT_PROMISE__) {
    await globalThis.__TEST_INIT_PROMISE__;
}

export const getApp = (): AbstractApp => {
    if (!globalThis.__TEST_APP__) {
        throw new Error("App not initialized. Check test setup logs.");
    }
    return globalThis.__TEST_APP__;
};
