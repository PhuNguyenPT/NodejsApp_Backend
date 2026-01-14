// test/setup.ts
import "reflect-metadata";
import { afterAll, beforeAll } from "vitest";

import type AbstractApp from "@/app/app.abstract.js";

import { iocContainer } from "@/app/ioc-container.js";
import { TYPES } from "@/type/container/types.js";

let app: AbstractApp | null = null;

beforeAll(async () => {
    // Check if already initialized (important for singleFork mode)
    if (app) {
        console.log("App already initialized, skipping...");
        return;
    }

    try {
        console.log("Starting test setup...");
        app = iocContainer.get<AbstractApp>(TYPES.App);

        console.log("Initializing app...");
        await app.initialize();
        console.log("Test setup completed");
    } catch (error) {
        console.error("Fatal error during test setup:", error);
        app = null;
        throw error;
    }
}, 60000);

afterAll(async () => {
    if (!app) return;

    try {
        console.log("Starting test teardown...");
        await app.shutdown();
        app = null;
        console.log("Test teardown completed");
    } catch (error) {
        console.error("Error during test teardown:", error);
    }
}, 30000);

export const getApp = (): AbstractApp => {
    if (!app) {
        throw new Error("App not initialized. Setup may have failed.");
    }
    return app;
};
