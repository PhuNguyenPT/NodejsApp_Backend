// test/setup.ts
import "reflect-metadata";

import type AbstractApp from "@/app/app.abstract.js";

import { iocContainer } from "@/app/ioc-container.js";
import { postgresDataSource } from "@/config/data-source.config.js";
import { TYPES } from "@/type/container/types.js";

declare global {
    var __TEST_APP__: AbstractApp | undefined;
    var __TEST_INITIALIZED__: boolean | undefined;
    var __TEST_INIT_PROMISE__: Promise<void> | undefined;
}

// Initialize only once using globalThis pattern (Vitest recommended approach)
if (!globalThis.__TEST_INITIALIZED__ && !globalThis.__TEST_INIT_PROMISE__) {
    console.log("🚀 Test Setup: Starting initialization...");

    globalThis.__TEST_INIT_PROMISE__ = (async () => {
        try {
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
            globalThis.__TEST_INITIALIZED__ = true;
        } catch (error) {
            console.error("❌ Test Setup: Initialization failed:", error);
            globalThis.__TEST_INIT_PROMISE__ = undefined;
            throw error;
        }
    })();
}

// Wait for initialization to complete (if in progress)
if (globalThis.__TEST_INIT_PROMISE__) {
    await globalThis.__TEST_INIT_PROMISE__;
}

export const getApp = (): AbstractApp => {
    if (!globalThis.__TEST_APP__) {
        throw new Error("App not initialized. Check test setup logs.");
    }
    return globalThis.__TEST_APP__;
};
