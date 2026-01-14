// test/app.spec.ts
import type { RedisClientType } from "redis";

import { DataSource } from "typeorm";
import { describe, expect, it } from "vitest";

import type { Config } from "@/config/app.config.js";

import { iocContainer } from "@/app/ioc-container.js";
import { TYPES } from "@/type/container/types.js";

import { getApp } from "./setup.js";

describe("App Integration Test", () => {
    describe("Infrastructure", () => {
        it("should initialize database", () => {
            const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
            expect(dataSource.isInitialized).toBe(true);
        });

        it("should connect to redis", () => {
            const redisPublisher = iocContainer.get<RedisClientType>(
                TYPES.RedisPublisher,
            );
            const redisSubscriber = iocContainer.get<RedisClientType>(
                TYPES.RedisSubscriber,
            );
            expect(redisPublisher.isOpen).toBe(true);
            expect(redisSubscriber.isOpen).toBe(true);
        });

        it("should create app instance", () => {
            const app = getApp();
            expect(app).toBeDefined();
            expect(app.express).toBeDefined();
        });
    });

    describe("Configuration", () => {
        it("should have correct port from config", () => {
            const app = getApp();
            const config = iocContainer.get<Config>(TYPES.Config);
            expect(app.port).toBe(config.SERVER_PORT);
        });

        it("should have correct hostname from config", () => {
            const app = getApp();
            const config = iocContainer.get<Config>(TYPES.Config);
            expect(app.hostname).toBe(config.SERVER_HOSTNAME);
        });

        it("should have correct base path from config", () => {
            const app = getApp();
            const config = iocContainer.get<Config>(TYPES.Config);
            expect(app.basePath).toBe(config.SERVER_PATH);
        });

        it("should generate correct server URL", () => {
            const app = getApp();
            const config = iocContainer.get<Config>(TYPES.Config);
            const url = app.getServerUrl();
            const expected = `http://${config.SERVER_HOSTNAME}:${config.SERVER_PORT.toString()}${config.SERVER_PATH}`;
            expect(url).toBe(expected);
        });
    });

    describe("Redis Operations", () => {
        it("should set and get value", async () => {
            const redis = iocContainer.get<RedisClientType>(
                TYPES.RedisPublisher,
            );

            await redis.set("test:key", "test-value");
            const value = await redis.get("test:key");
            expect(value).toBe("test-value");

            // Cleanup
            await redis.del("test:key");
        });

        it("should store JSON", async () => {
            const redis = iocContainer.get<RedisClientType>(
                TYPES.RedisPublisher,
            );

            const data = { id: 1, name: "Test" };
            await redis.set("test:json", JSON.stringify(data));
            const retrieved = await redis.get("test:json");
            if (!retrieved) {
                throw new Error("Failed to retrieve value from Redis");
            }

            expect(JSON.parse(retrieved)).toEqual(data);

            // Cleanup
            await redis.del("test:json");
        });
    });

    describe("Database Operations", () => {
        it("should query database", async () => {
            const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);

            const result =
                await dataSource.query<{ num: number }[]>("SELECT 1 as num");
            expect(result[0].num).toBe(1);
        });

        it("should have entities loaded", () => {
            const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);

            const entities = dataSource.entityMetadatas;
            expect(entities.length).toBeGreaterThan(0);
        });
    });
});
