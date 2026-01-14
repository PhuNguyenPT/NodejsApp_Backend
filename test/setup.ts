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
 * CRITICAL: Synchronous lock BEFORE any async work
 * This prevents race conditions when multiple test files load simultaneously
 */
if (!globalThis.__TEST_SETUP_LOCK__) {
    // Set lock IMMEDIATELY (synchronous - no race possible)
    globalThis.__TEST_SETUP_LOCK__ = true;

    console.log("🚀 Test Setup: Starting initialization...");

    globalThis.__TEST_INIT_PROMISE__ = (async () => {
        try {
            // Get app from IOC container (bindings protected in ioc-container.ts)
            const app = iocContainer.get<AbstractApp>(TYPES.App);

            console.log("⏳ Initializing application components...");
            await app.initialize();

            // Verify infrastructure
            if (!postgresDataSource.isInitialized) {
                throw new Error("PostgreSQL DataSource failed to initialize");
            }

            const entityCount = postgresDataSource.entityMetadatas.length;
            console.log(
                `✅ Loaded ${entityCount.toString()} entity metadata entries`,
            );

            if (entityCount === 0) {
                throw new Error(
                    "No entities loaded - check TypeORM configuration",
                );
            }

            console.log("✅ Test Setup: Application initialized and ready");

            globalThis.__TEST_APP__ = app;
        } catch (error) {
            console.error("❌ Test Setup: Initialization failed:", error);
            // Clear both lock and promise so it can be retried
            globalThis.__TEST_SETUP_LOCK__ = undefined;
            globalThis.__TEST_INIT_PROMISE__ = undefined;
            throw error;
        }
    })();
}

// Wait for initialization (all test files wait for the same promise)
if (globalThis.__TEST_INIT_PROMISE__) {
    await globalThis.__TEST_INIT_PROMISE__;
}

export const getApp = (): AbstractApp => {
    if (!globalThis.__TEST_APP__) {
        throw new Error("App not initialized. Check test setup logs.");
    }
    return globalThis.__TEST_APP__;
};
