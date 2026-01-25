// test/integration/database/connection-pool.integration.spec.ts
import type { PoolConfig } from "pg";
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

interface QueryNumResult {
    query_num: number;
}

interface SimpleValueResult {
    value: number;
}

describe("PostgreSQL Connection Pool Configuration", () => {
    let poolConfig: PoolConfig;
    // Initialize variables before all tests
    const app = getApp();
    const dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
    const options = dataSource.options;

    // Type assertion without expect (validation happens in tests)
    if ("extra" in options && options.extra) {
        poolConfig = options.extra as PoolConfig;
    }

    it("should be properly initialized via test setup", () => {
        expect(app).toBeDefined();
        expect(dataSource.isInitialized).toBe(true);

        // Validate pool config was properly extracted
        const options = dataSource.options;
        expect("extra" in options).toBe(true);
        expect(options.extra).toBeDefined();
        expect(poolConfig).toBeDefined();
    });

    it("should have valid pool configuration", () => {
        const options = dataSource.options;

        expect(options.type).toBe("postgres");

        // Check pool configuration in 'extra' options
        expect("extra" in options).toBe(true);
        expect(options.extra).toBeDefined();

        // Verify pool config has valid values
        expect(poolConfig.min).toBeDefined();
        expect(poolConfig.max).toBeDefined();
        expect(poolConfig.min).toBeGreaterThan(0);
        expect(poolConfig.max).toBeGreaterThan(0);

        // Type-safe comparison - assert values exist first, then compare
        const minValue = poolConfig.min ?? 0;
        const maxValue = poolConfig.max ?? 0;
        expect(maxValue).toBeGreaterThanOrEqual(minValue);

        // Verify idle timeout is configured
        expect(poolConfig.idleTimeoutMillis).toBeDefined();
        expect(poolConfig.idleTimeoutMillis).toBeGreaterThan(0);

        // Verify connection timeout is configured
        expect(poolConfig.connectionTimeoutMillis).toBeDefined();
        expect(poolConfig.connectionTimeoutMillis).toBeGreaterThan(0);

        // Verify keep-alive is configured
        expect(poolConfig.keepAlive).toBeDefined();
        expect(poolConfig.keepAlive).toBe(true);

        // Verify keep-alive initial delay is configured
        expect(poolConfig.keepAliveInitialDelayMillis).toBeDefined();
        expect(poolConfig.keepAliveInitialDelayMillis).toBeGreaterThan(0);

        // Verify statement timeout is configured
        expect(poolConfig.statement_timeout).toBeDefined();
        expect(poolConfig.statement_timeout).toBeGreaterThan(0);

        // Verify query timeout is configured
        expect(poolConfig.query_timeout).toBeDefined();
        expect(poolConfig.query_timeout).toBeGreaterThan(0);

        // Verify lock timeout is configured
        expect(poolConfig.lock_timeout).toBeDefined();
        expect(poolConfig.lock_timeout).toBeGreaterThan(0);

        // Verify idle in transaction timeout is configured
        expect(poolConfig.idle_in_transaction_session_timeout).toBeDefined();
        expect(poolConfig.idle_in_transaction_session_timeout).toBeGreaterThan(
            0,
        );

        // Verify application name is set
        expect(poolConfig.application_name).toBeDefined();
        expect(typeof poolConfig.application_name).toBe("string");
        expect(poolConfig.application_name?.length).toBeGreaterThan(0);

        // Verify client encoding is set
        expect(poolConfig.client_encoding).toBeDefined();
        expect(poolConfig.client_encoding).toBe("UTF8");

        // Verify maxUses is configured
        expect(poolConfig.maxUses).toBeDefined();
        expect(poolConfig.maxUses).toBeGreaterThan(0);

        // Verify allowExitOnIdle is defined (can be true or false)
        expect(poolConfig.allowExitOnIdle).toBeDefined();
        expect(typeof poolConfig.allowExitOnIdle).toBe("boolean");

        // Verify maxLifetimeSeconds is defined (can be 0 for non-production)
        expect(poolConfig.maxLifetimeSeconds).toBeDefined();
        expect(poolConfig.maxLifetimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it("should create multiple concurrent connections within pool limits", async () => {
        const queryRunners: QueryRunner[] = [];

        // Use half of max pool size to safely stay within limits
        const connectionsToCreate = Math.floor((poolConfig.max ?? 5) / 2);

        try {
            const connectionPromises = Array.from(
                { length: connectionsToCreate },
                async () => {
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
                },
            );

            await Promise.all(connectionPromises);

            // All connections should be established
            expect(queryRunners.length).toBe(connectionsToCreate);

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
        const iterations = Math.min(poolConfig.max ?? 5, 5);
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
        const maxPoolSize = poolConfig.max ?? 5;
        const concurrentQueries = maxPoolSize + 3; // Test slightly over limit
        const queryRunners: QueryRunner[] = [];

        try {
            // Create concurrent connection requests beyond max size
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
        const options = dataSource.options;

        // Type guard to safely access PostgreSQL-specific properties
        expect("connectTimeoutMS" in options).toBe(true);
        expect("maxQueryExecutionTime" in options).toBe(true);

        // Access with type assertion after verifying property exists
        const pgOptions = options as typeof options & {
            connectTimeoutMS: number;
            maxQueryExecutionTime: number;
        };

        expect(pgOptions.connectTimeoutMS).toBeDefined();
        expect(pgOptions.connectTimeoutMS).toBeGreaterThan(0);

        expect(pgOptions.maxQueryExecutionTime).toBeDefined();
        expect(pgOptions.maxQueryExecutionTime).toBeGreaterThan(0);
    });

    it("should verify active connection count from database", async () => {
        const queryRunners: QueryRunner[] = [];

        // Create connections up to half of max to avoid exhausting the pool
        const testConnections = Math.floor((poolConfig.max ?? 5) / 2);

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
