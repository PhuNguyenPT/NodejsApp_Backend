// src/config/redis.ts
import { createClient, type RedisClientType } from "redis";

import { config } from "@/util/validate-env.js";

import { logger } from "./logger.config.js";

// Base Redis configuration
export const redisConfig = {
    database: config.REDIS_DB,
    password: config.REDIS_USER_PASSWORD,
    socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
    },
    username: config.REDIS_USERNAME,
} as const;

// Main Redis client for general operations (publishing, get/set operations)
export const redisClient: RedisClientType = createClient(redisConfig);

// Dedicated client for subscribing (required for pub/sub)
export const redisSubscriber: RedisClientType = createClient(redisConfig);

// Setup event handlers for main client (Publisher)
redisClient.on("error", (err: Error) => {
    logger.error("Redis Publisher Client Error:", err.message);
});

redisClient.on("connect", () => {
    logger.info("✅ Connected to Redis (Publisher)");
});

redisClient.on("ready", () => {
    logger.info("✅ Redis Publisher client ready");
});

redisClient.on("reconnecting", () => {
    logger.warn("🔄 Redis Publisher client reconnecting...");
});

redisClient.on("end", () => {
    logger.info("❌ Redis Publisher connection ended");
});

// Setup event handlers for subscriber client
redisSubscriber.on("error", (err: Error) => {
    logger.error("Redis Subscriber Client Error:", err.message);
});

redisSubscriber.on("connect", () => {
    logger.info("✅ Connected to Redis (Subscriber)");
});

redisSubscriber.on("ready", () => {
    logger.info("✅ Redis Subscriber client ready");
});

redisSubscriber.on("reconnecting", () => {
    logger.warn("🔄 Redis Subscriber client reconnecting...");
});

redisSubscriber.on("end", () => {
    logger.info("❌ Redis Subscriber connection ended");
});

// Initialize Redis connections
export const initializeRedis = async (): Promise<void> => {
    try {
        // Connect both clients concurrently
        await Promise.all([redisClient.connect(), redisSubscriber.connect()]);

        logger.info(
            "✅ Redis Publisher and Subscriber clients initialized successfully",
        );
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        logger.error("❌ Failed to connect to Redis:", errorMessage);
        throw error;
    }
};

// Graceful shutdown helper
export const closeRedisConnections = async (): Promise<void> => {
    try {
        await Promise.all([redisClient.quit(), redisSubscriber.quit()]);
        logger.info("✅ Redis connections closed gracefully");
    } catch (error) {
        logger.error("❌ Error closing Redis connections:", error);
        throw error;
    }
};

// Health check helper
export const isRedisHealthy = (): boolean => {
    return redisClient.isReady && redisSubscriber.isReady;
};
