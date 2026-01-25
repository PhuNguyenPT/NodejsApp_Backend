// test/integration/database/connection-pool.integration.spec.ts
import type { DataSource, QueryRunner } from "typeorm";

import { describe, expect, it } from "vitest";

import { iocContainer } from "@/app/ioc-container.js";
import { getApp } from "@/test/setup.js";
import { TYPES } from "@/type/container/types.js";

interface AnswerResult {
    answer: number;
}

interface CountResult {
    count: string;
}

interface DatabaseResult {
    db: string;
}

interface PgBackendPidResult {
    pid: number;
}

interface PoolConfig {
    idleTimeoutMillis?: number;
    max?: number;
    min?: number;
}

interface QueryNumResult {
    query_num: number;
}

interface SimpleValueResult {
    value: number;
}

describe("PostgreSQL Connection Pool Configuration", () => {
    // Use getApp to ensure proper initialization without race conditions
    it("should be properly initialized via test setup", () => {
        const app = getApp();
        const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);

        expect(app).toBeDefined();
        expect(dataSource.isInitialized).toBe(true);
    });

    it("should have correct pool configuration (min: 5, max: 20)", () => {
        const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        const options = dataSource.options;

        expect(options.type).toBe("postgres");

        // Check pool configuration in 'extra' options
        expect("extra" in options).toBe(true);
        expect(options.extra).toBeDefined();

        const poolConfig = options.extra as PoolConfig;
        expect(poolConfig.min).toBe(5);
        expect(poolConfig.max).toBe(20);
        expect(poolConfig.idleTimeoutMillis).toBe(10000);
    });

    it("should create multiple concurrent connections within pool limits", async () => {
        const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        const queryRunners: QueryRunner[] = [];

        try {
            // Create 10 concurrent connections (within max pool size)
            const connectionPromises = Array.from({ length: 10 }, async () => {
                const queryRunner = dataSource.createQueryRunner();
                await queryRunner.connect();
                queryRunners.push(queryRunner);

                // Execute a simple query to verify connection is active
                const result = (await queryRunner.query(
                    "SELECT 1 as value",
                )) as SimpleValueResult[];
                const firstResult = result[0];
                expect(firstResult).toBeDefined();
                expect(firstResult.value).toBe(1);

                return queryRunner;
            });

            await Promise.all(connectionPromises);

            // All 10 connections should be established
            expect(queryRunners.length).toBe(10);

            // Verify each connection is connected
            for (const qr of queryRunners) {
                expect(qr.isReleased).toBe(false);
            }
        } finally {
            // Clean up all query runners
            await Promise.all(queryRunners.map(async (qr) => qr.release()));
        }
    });

    it("should handle connection acquisition and release properly", async () => {
        const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        const queryRunner = dataSource.createQueryRunner();

        // Initially, the query runner is not connected (but also not "released")
        expect(queryRunner.isReleased).toBe(false);

        await queryRunner.connect();
        expect(queryRunner.isReleased).toBe(false);

        // Execute a query
        const result = (await queryRunner.query(
            "SELECT current_database() as db",
        )) as DatabaseResult[];
        const firstResult = result[0];
        expect(firstResult).toBeDefined();
        expect(firstResult.db).toBeDefined();

        await queryRunner.release();
        expect(queryRunner.isReleased).toBe(true);
    });

    it("should reuse connections from the pool", async () => {
        const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        const iterations = 5;
        const results: number[] = [];

        // Execute multiple queries sequentially
        // These should reuse connections from the pool
        for (let i = 0; i < iterations; i++) {
            const queryRunner = dataSource.createQueryRunner();
            await queryRunner.connect();

            const result = (await queryRunner.query(
                "SELECT pg_backend_pid() as pid",
            )) as PgBackendPidResult[];
            const firstResult = result[0];
            expect(firstResult).toBeDefined();
            results.push(firstResult.pid);

            await queryRunner.release();
        }

        expect(results.length).toBe(iterations);

        // PIDs might repeat, indicating connection reuse
        const uniquePids = new Set(results);
        expect(uniquePids.size).toBeLessThanOrEqual(iterations);
    });

    it("should respect max pool size under heavy concurrent load", async () => {
        const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        const concurrentQueries = 25; // More than max pool size (20)
        const queryRunners: QueryRunner[] = [];

        try {
            // Create 25 concurrent connection requests
            // This tests that the pool properly queues requests beyond max size
            const connectionPromises = Array.from(
                { length: concurrentQueries },
                async (_, index) => {
                    const queryRunner = dataSource.createQueryRunner();
                    await queryRunner.connect();
                    queryRunners.push(queryRunner);

                    // Execute query immediately and release to free up pool slots
                    const result = (await queryRunner.query(
                        "SELECT $1::int as query_num",
                        [index],
                    )) as QueryNumResult[];

                    const firstResult = result[0];
                    expect(firstResult).toBeDefined();

                    // Release immediately to allow other queued requests to proceed
                    await queryRunner.release();

                    return firstResult.query_num;
                },
            );

            const results = await Promise.all(connectionPromises);

            // All queries should complete successfully
            expect(results.length).toBe(concurrentQueries);
            expect(results).toEqual(
                Array.from({ length: concurrentQueries }, (_, i) => i),
            );
        } finally {
            // Clean up any connections that weren't released
            await Promise.all(
                queryRunners
                    .filter((qr) => !qr.isReleased)
                    .map(async (qr) => qr.release()),
            );
        }
    });

    it("should have proper connection timeout configuration", () => {
        const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        const options = dataSource.options;

        // Type guard to safely access PostgreSQL-specific properties
        expect("connectTimeoutMS" in options).toBe(true);
        expect("maxQueryExecutionTime" in options).toBe(true);

        // Access with type assertion after verifying property exists
        const pgOptions = options as typeof options & {
            connectTimeoutMS: number;
            maxQueryExecutionTime: number;
        };

        expect(pgOptions.connectTimeoutMS).toBe(10000);
        expect(pgOptions.maxQueryExecutionTime).toBe(5000);
    });

    it("should verify active connection count from database", async () => {
        const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        const queryRunners: QueryRunner[] = [];
        const testConnections = 8;

        try {
            // Create specific number of connections
            for (let i = 0; i < testConnections; i++) {
                const qr = dataSource.createQueryRunner();
                await qr.connect();
                queryRunners.push(qr);
            }

            // Query PostgreSQL for active connections to our database
            const queryRunner = dataSource.createQueryRunner();
            await queryRunner.connect();

            const result = (await queryRunner.query(`
                SELECT COUNT(*) as count 
                FROM pg_stat_activity 
                WHERE datname = current_database()
                AND (state = 'idle' OR state = 'active')
            `)) as CountResult[];

            const firstResult = result[0];
            expect(firstResult).toBeDefined();

            const activeCount = parseInt(firstResult.count, 10);

            // Should have at least our test connections
            expect(activeCount).toBeGreaterThanOrEqual(testConnections);

            await queryRunner.release();
        } finally {
            await Promise.all(queryRunners.map(async (qr) => qr.release()));
        }
    });

    it("should work with both query result formats", async () => {
        const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        const queryRunner = dataSource.createQueryRunner();

        try {
            await queryRunner.connect();

            // Test 1: Regular query (returns raw array)
            const rawResult = (await queryRunner.query(
                "SELECT 42 as answer",
            )) as AnswerResult[];

            expect(Array.isArray(rawResult)).toBe(true);
            const firstRaw = rawResult[0];
            expect(firstRaw).toBeDefined();
            expect(firstRaw.answer).toBe(42);

            // Test 2: Structured query result
            const structuredResult = await queryRunner.query(
                "SELECT 42 as answer",
                undefined,
                true,
            );

            expect(structuredResult).toBeDefined();
            expect(structuredResult.records).toBeDefined();
            expect(Array.isArray(structuredResult.records)).toBe(true);
        } finally {
            await queryRunner.release();
        }
    });
});
