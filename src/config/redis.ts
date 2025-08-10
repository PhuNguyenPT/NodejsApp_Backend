// src/config/redis.ts
import { createClient, type RedisClientType } from "redis";

import logger from "@/util/logger.js";
import { config } from "@/util/validate.env.js";

export const redisClient: RedisClientType = createClient({
    database: config.REDIS_DB,
    password: config.REDIS_USER_PASSWORD,
    socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
    },
    username: config.REDIS_USERNAME,
});

// Handle Redis connection events
redisClient.on("error", (err: Error) => {
    logger.error("Redis Client Error:", err.message);
});

redisClient.on("connect", () => {
    logger.info("✅ Connected to Redis");
});

redisClient.on("ready", () => {
    logger.info("✅ Redis client ready");
});

redisClient.on("reconnecting", () => {
    logger.warn("🔄 Redis client reconnecting...");
});

redisClient.on("end", () => {
    logger.info("❌ Redis connection ended");
});

// Initialize Redis connection
export const initializeRedis = async (): Promise<void> => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        logger.info("✅ Redis initialization completed");
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
        logger.error("❌ Failed to connect to Redis:", errorMessage);
        throw error;
    }
};
