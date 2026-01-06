// test/app.spec.ts
import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type AbstractApp from "@/app/app.abstract.js";
import type { Config } from "@/config/app.config.js";

import { iocContainer } from "@/app/ioc-container.js";
import { postgresDataSource } from "@/config/data-source.config.js";
import { redisClient, redisSubscriber } from "@/config/redis.config.js";
import { TYPES } from "@/type/container/types.js";

describe("App Integration Test", () => {
    let app: AbstractApp;

    beforeAll(async () => {
        try {
            // Initialize database
            if (!postgresDataSource.isInitialized) {
                await postgresDataSource.initialize();
            }

            // Initialize Redis
            if (!redisClient.isOpen) {
                await redisClient.connect();
            }
            if (!redisSubscriber.isOpen) {
                await redisSubscriber.connect();
            }

            // Get app from container
            app = iocContainer.get<AbstractApp>(TYPES.App);
            await app.initialize();
        } catch (error) {
            console.error("error", error);
        }
    }, 30000);

    afterAll(async () => {
        try {
            await app.shutdown();

            if (postgresDataSource.isInitialized) {
                await postgresDataSource.destroy();
            }

            if (redisClient.isOpen) {
                await redisClient.quit();
            }
            if (redisSubscriber.isOpen) {
                await redisSubscriber.quit();
            }
        } catch (error) {
            console.error("error", error);
        }
    });

    describe("Infrastructure", () => {
        it("should initialize database", () => {
            expect(postgresDataSource.isInitialized).toBe(true);
        });

        it("should connect to redis", () => {
            expect(redisClient.isOpen).toBe(true);
        });

        it("should create app instance", () => {
            expect(app).toBeDefined();
            expect(app.express).toBeDefined();
        });
    });

    describe("Configuration", () => {
        it("should have correct port from config", () => {
            const config = iocContainer.get<Config>(TYPES.Config);
            expect(app.port).toBe(config.SERVER_PORT);
        });

        it("should have correct hostname from config", () => {
            const config = iocContainer.get<Config>(TYPES.Config);
            expect(app.hostname).toBe(config.SERVER_HOSTNAME);
        });

        it("should have correct base path from config", () => {
            const config = iocContainer.get<Config>(TYPES.Config);
            expect(app.basePath).toBe(config.SERVER_PATH);
        });

        it("should generate correct server URL", () => {
            const config = iocContainer.get<Config>(TYPES.Config);
            const url = app.getServerUrl();
            const expected = `http://${config.SERVER_HOSTNAME}:${config.SERVER_PORT.toString()}${config.SERVER_PATH}`;
            expect(url).toBe(expected);
        });
    });

    describe("Redis Operations", () => {
        it("should set and get value", async () => {
            await redisClient.set("test:key", "test-value");
            const value = await redisClient.get("test:key");
            expect(value).toBe("test-value");

            // Cleanup
            await redisClient.del("test:key");
        });

        it("should store JSON", async () => {
            const data = { id: 1, name: "Test" };
            await redisClient.set("test:json", JSON.stringify(data));
            const retrieved = await redisClient.get("test:json");
            if (!retrieved) {
                throw new Error("Failed to retrieve value from Redis");
            }

            expect(JSON.parse(retrieved)).toEqual(data);

            // Cleanup
            await redisClient.del("test:json");
        });
    });

    describe("Database Operations", () => {
        it("should query database", async () => {
            const result =
                await postgresDataSource.query<{ num: number }[]>(
                    "SELECT 1 as num",
                );
            expect(result[0].num).toBe(1);
        });

        it("should have entities loaded", () => {
            const entities = postgresDataSource.entityMetadatas;
            expect(entities.length).toBeGreaterThan(0);
        });
    });
});
