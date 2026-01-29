// test/setup.ts
import "reflect-metadata";

import type { Container } from "inversify";

import type AbstractApp from "@/app/app.abstract.js";

import { iocContainer } from "@/app/ioc-container.js";
import { postgresDataSource } from "@/config/data-source.config.js";
import { TYPES } from "@/type/container/types.js";

declare global {
    var __TEST_APP__: AbstractApp | undefined;
    var __TEST_INIT_PROMISE__: Promise<void> | undefined;
}

/**
 * WORKER SETUP - Runs ONCE per worker thread
 *
 * CRITICAL:
 * - Use PostgreSQL advisory lock for migrations (once across all workers)
 * - Each worker initializes its own app instance independently
 */

const workerId = process.env.VITEST_WORKER_ID ?? "main";
const MIGRATION_LOCK_ID = 123456;

/**
 * Initialize app for this specific worker
 * Each worker gets its own app instance
 */
async function initializeWorkerApp() {
    console.log(
        `🔧 Worker ${workerId}: Initializing application components...`,
    );

    try {
        const app = iocContainer.get<AbstractApp>(TYPES.App);

        // Initialize app (database already connected and migrated)
        await app.initialize();

        if (!postgresDataSource.isInitialized) {
            throw new Error("PostgreSQL DataSource failed to initialize");
        }

        const entityCount = postgresDataSource.entityMetadatas.length;
        console.log(
            `✅ Worker ${workerId}: Loaded ${entityCount.toString()} entity metadata entries`,
        );

        if (entityCount === 0) {
            throw new Error("No entities loaded - check TypeORM configuration");
        }

        console.log(`✅ Worker ${workerId}: Ready to run tests`);

        return app;
    } catch (error) {
        console.error(`❌ Worker ${workerId}: Initialization failed:`, error);
        throw error;
    }
}

/**
 * Run migrations with PostgreSQL advisory lock
 * Only one worker across ALL processes can run migrations
 */
async function runMigrationsOnce() {
    console.log(
        `🔧 Worker ${workerId}: Attempting to acquire migration lock...`,
    );

    // Initialize connection if needed
    if (!postgresDataSource.isInitialized) {
        await postgresDataSource.initialize();
    }

    // Try to acquire advisory lock (non-blocking)
    const result = await postgresDataSource.query<
        [{ pg_try_advisory_lock: boolean }]
    >("SELECT pg_try_advisory_lock($1)", [MIGRATION_LOCK_ID]);

    const gotLock = result[0].pg_try_advisory_lock;

    if (gotLock) {
        // We got the lock - run migrations
        console.log(
            `✅ Worker ${workerId}: Acquired lock - running migrations`,
        );

        try {
            const migrations = await postgresDataSource.runMigrations({
                transaction: "all",
            });

            console.log(
                `✅ Worker ${workerId}: Ran ${migrations.length.toString()} migration(s)`,
            );
            if (migrations.length > 0) {
                migrations.forEach((migration) => {
                    console.log(`   - ${migration.name}`);
                });
            } else {
                console.log("   (No new migrations - database is up to date)");
            }
        } finally {
            // Release the advisory lock
            await postgresDataSource.query("SELECT pg_advisory_unlock($1)", [
                MIGRATION_LOCK_ID,
            ]);
            console.log(`🔓 Worker ${workerId}: Released migration lock`);
        }
    } else {
        // Another worker has the lock - wait
        console.log(
            `⏳ Worker ${workerId}: Another worker is running migrations, waiting...`,
        );

        // Poll until migrations are complete
        let waited = 0;
        const maxWait = 60000; // 60 seconds
        const pollInterval = 100; // 100ms

        while (waited < maxWait) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            waited += pollInterval;

            // Check if lock is available (migrations done)
            const checkResult = await postgresDataSource.query<
                [{ pg_try_advisory_lock: boolean }]
            >("SELECT pg_try_advisory_lock($1)", [MIGRATION_LOCK_ID]);

            if (checkResult[0].pg_try_advisory_lock) {
                // Migrations done - release lock immediately
                await postgresDataSource.query(
                    "SELECT pg_advisory_unlock($1)",
                    [MIGRATION_LOCK_ID],
                );
                console.log(
                    `✅ Worker ${workerId}: Migrations complete (waited ${waited.toString()}ms)`,
                );
                break;
            }
        }

        if (waited >= maxWait) {
            throw new Error(
                `Worker ${workerId}: Timeout waiting for migrations`,
            );
        }
    }
}

// Step 1: Run migrations (once across all workers)
await runMigrationsOnce();

// Step 2: Initialize app for THIS worker
// Note: globalThis is per-worker, so we use nullish coalescing
globalThis.__TEST_INIT_PROMISE__ ??= initializeWorkerApp().then((app) => {
    globalThis.__TEST_APP__ = app;
});

await globalThis.__TEST_INIT_PROMISE__;

export const getApp = (): AbstractApp => {
    if (!globalThis.__TEST_APP__) {
        throw new Error("App not initialized. Check test setup logs.");
    }
    return globalThis.__TEST_APP__;
};

export const getContainer = (): Container => {
    if (!globalThis.__IOC_CONTAINER__) {
        throw new Error("Container not initialized. Check test setup logs.");
    }
    return globalThis.__IOC_CONTAINER__;
};
