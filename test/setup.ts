// test/setup.ts
import "reflect-metadata";

import type { Container } from "inversify";
import type { DataSource } from "typeorm";

import { Logger } from "winston";

import type AbstractApp from "@/app/app.abstract.js";

import { TYPES } from "@/type/container/types.js";

declare global {
    var __TEST_APP__: AbstractApp | undefined;
    var __TEST_INIT_PROMISE__: Promise<void> | undefined;
}

const workerId = process.env.VITEST_WORKER_ID ?? "main";
const MIGRATION_LOCK_ID = 123456;

/**
 * Initialize app for this specific worker
 */
async function initializeWorkerApp(container: Container): Promise<AbstractApp> {
    const logger = container.get<Logger>(TYPES.Logger);

    logger.info(
        `🔧 Worker ${workerId}: Initializing application components...`,
    );

    try {
        const app = container.get<AbstractApp>(TYPES.App);
        await app.initialize();

        const postgresDataSource = container.get<DataSource>(TYPES.DataSource);
        if (!postgresDataSource.isInitialized) {
            throw new Error("PostgreSQL DataSource failed to initialize");
        }

        const entityCount = postgresDataSource.entityMetadatas.length;
        logger.info(
            `✅ Worker ${workerId}: Loaded ${entityCount.toString()} entity metadata entries`,
        );

        if (entityCount === 0) {
            throw new Error("No entities loaded - check TypeORM configuration");
        }

        logger.info(`✅ Worker ${workerId}: Ready to run tests`);

        return app;
    } catch (error) {
        logger.error(`❌ Worker ${workerId}: Initialization failed:`, error);
        throw error;
    }
}

/**
 * Run migrations with PostgreSQL advisory lock
 * Only one worker across ALL processes can run migrations
 */
async function runMigrationsOnce(container: Container): Promise<void> {
    const logger = container.get<Logger>(TYPES.Logger);
    logger.info(
        `🔧 Worker ${workerId}: Attempting to acquire migration lock...`,
    );
    const postgresDataSource = container.get<DataSource>(TYPES.DataSource);

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
        logger.info(
            `✅ Worker ${workerId}: Acquired lock - running migrations`,
        );

        try {
            const migrations = await postgresDataSource.runMigrations({
                transaction: "all",
            });

            logger.info(
                `✅ Worker ${workerId}: Ran ${migrations.length.toString()} migration(s)`,
            );
            if (migrations.length > 0) {
                migrations.forEach((migration) => {
                    logger.info(`   - ${migration.name}`);
                });
            } else {
                logger.info("   (No new migrations - database is up to date)");
            }
        } finally {
            await postgresDataSource.query("SELECT pg_advisory_unlock($1)", [
                MIGRATION_LOCK_ID,
            ]);
            logger.info(`🔓 Worker ${workerId}: Released migration lock`);
        }
    } else {
        logger.info(
            `⏳ Worker ${workerId}: Another worker is running migrations, waiting...`,
        );

        let waited = 0;
        const maxWait = 60000; // 60 seconds
        const pollInterval = 100; // 100ms

        while (waited < maxWait) {
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            waited += pollInterval;

            const checkResult = await postgresDataSource.query<
                [{ pg_try_advisory_lock: boolean }]
            >("SELECT pg_try_advisory_lock($1)", [MIGRATION_LOCK_ID]);

            if (checkResult[0].pg_try_advisory_lock) {
                await postgresDataSource.query(
                    "SELECT pg_advisory_unlock($1)",
                    [MIGRATION_LOCK_ID],
                );
                logger.info(
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

/**
 * Main setup function - orchestrates the entire test environment setup
 *
 * Steps:
 * 1. Import and initialize IoC container
 * 2. Run database migrations (once across all workers)
 * 3. Initialize app for this worker
 * 4. Store app in global state
 */
async function setupTestEnvironment(): Promise<void> {
    // Step 1: Import container (ensures full initialization)
    const { iocContainer } = await import("@/app/ioc-container.js");
    const logger = iocContainer.get<Logger>(TYPES.Logger);
    logger.info(`🚀 Worker ${workerId}: Starting test environment setup...`);

    // Step 2: Run migrations (coordinated across workers)
    await runMigrationsOnce(iocContainer);

    // Step 3: Initialize app for this worker
    globalThis.__TEST_INIT_PROMISE__ ??= initializeWorkerApp(iocContainer).then(
        (app) => {
            globalThis.__TEST_APP__ = app;
        },
    );

    await globalThis.__TEST_INIT_PROMISE__;

    console.log(`✅ Worker ${workerId}: Test environment setup complete`);
}

// Execute setup
await setupTestEnvironment();

// Export helper functions for test files
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
