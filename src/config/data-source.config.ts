import type { PoolConfig } from "pg";
import type { LogLevel } from "typeorm";
import type { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions.js";

import { DataSource } from "typeorm";

import { L2Entity } from "@/entity/machine_learning/l2.entity.js";
import { TranscriptSubjectGroupEntity } from "@/entity/machine_learning/transcript-subject-group.entity.js";
import { UniL1Entity } from "@/entity/machine_learning/uni_l1.entity.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { AcademicPerformanceEntity } from "@/entity/uni_guide/academic-performance.entity.js";
import { AdmissionEntity } from "@/entity/uni_guide/admission.entity.js";
import { AptitudeExamEntity } from "@/entity/uni_guide/aptitude-exam.entity.js";
import { AwardEntity } from "@/entity/uni_guide/award.entity.js";
import { CertificationEntity } from "@/entity/uni_guide/certification.entity.js";
import { ConductEntity } from "@/entity/uni_guide/conduct.entity.js";
import { FileEntity } from "@/entity/uni_guide/file.entity.js";
import { MajorGroupEntity } from "@/entity/uni_guide/major-group.entity.js";
import { MajorEntity } from "@/entity/uni_guide/major.entity.js";
import { NationalExamEntity } from "@/entity/uni_guide/national-exam.enity.js";
import { OcrResultEntity } from "@/entity/uni_guide/ocr-result.entity.js";
import { PredictionResultEntity } from "@/entity/uni_guide/prediction-result.entity.js";
import { StudentAdmissionEntity } from "@/entity/uni_guide/student-admission.entity.js";
import { StudentMajorGroupEntity } from "@/entity/uni_guide/student-major-group.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TalentExamEntity } from "@/entity/uni_guide/talent-exam.entity.js";
import { TranscriptSubjectEntity } from "@/entity/uni_guide/transcript-subject.entity.js";
import { TranscriptEntity } from "@/entity/uni_guide/transcript.entity.js";
import { VnuhcmScoreComponentEntity } from "@/entity/uni_guide/vnuhcm-score-component.entity.js";
import { VsatExamEntity } from "@/entity/uni_guide/vsat-exam.entity.js";
import { CreateSchemas1754794900000 } from "@/migration/1754794900000-create-schemas.js";
import { InitialSchema1754794905473 } from "@/migration/1754794905473-initial-schema.js";
import { CreateDefaultAdmin1754794920377 } from "@/migration/1754794920377-create-default-admin.js";
import { MajorData1755086125584 } from "@/migration/1755086125584-major-data.js";
import { AdmissionData1757342612756 } from "@/migration/1757342612756-admission-data.js";
import { L2Data1760411108656 } from "@/migration/1760411108656-l2-data.js";
import { TranscriptSubjectGroup1760934064921 } from "@/migration/1760934064921-transcript-subject-group.js";
import { UniItemL1Data1761452875227 } from "@/migration/1761452875227-uni-item-l1-data.js";
import { Transcript1764903586789 } from "@/migration/1764903586789-transcript.js";
import { MigrateUuidFromUUIDV4ToUUIDV71769316140669 } from "@/migration/1769316140669-migrate-uuid-from-uuidv4-to-uuidv7.js";
import { ExamTypeChange1769859209514 } from "@/migration/1769859209514-exam-type-change.js";
import { config } from "@/util/validate-env.js";

/**
 * Production-optimized PostgreSQL connection pool configuration
 *
 * Pool sizing strategy:
 * - Production: max 20, min 5 (handles high concurrency)
 * - Development: max 10, min 2 (lighter footprint)
 * - Test: max 5, min 2 (minimal resources)
 */
const poolConfig: PoolConfig = {
    // === Process Management ===
    // Allow Node.js process to exit when pool is idle
    // Set to false in production to keep service running
    allowExitOnIdle: config.NODE_ENV === "test",

    // === Application Identification ===
    // Shows in pg_stat_activity for easier debugging
    application_name: `nodejs-app-${config.NODE_ENV}`,

    // === Encoding ===
    client_encoding: "UTF8",

    // Timeout when acquiring connection from pool
    // Prevents indefinite waiting when pool is exhausted
    connectionTimeoutMillis: config.NODE_ENV === "production" ? 5000 : 3000,

    // Idle in transaction timeout (60 seconds)
    // Closes connections left in transaction state
    idle_in_transaction_session_timeout: 60000,

    // === Timeout Configuration ===
    // Idle connection timeout (when to remove idle connections)
    idleTimeoutMillis: 10000, // 10 seconds

    // === TCP Keep-Alive ===
    // Enable TCP keep-alive to detect broken connections
    keepAlive: true,

    // Delay before sending first keep-alive probe (10 seconds)
    keepAliveInitialDelayMillis: 10000,

    // Lock acquisition timeout (10 seconds)
    // Prevents deadlocks from holding connections
    lock_timeout: 10000,

    // === Pool Size Configuration ===
    // Maximum connections in pool
    max:
        config.NODE_ENV === "production"
            ? 20
            : config.NODE_ENV === "test"
              ? 5
              : 10,

    // Maximum lifetime of a connection (in seconds)
    // Forces connection refresh to prevent stale connections
    maxLifetimeSeconds: config.NODE_ENV === "production" ? 1800 : 0, // 30 min in prod

    // === Connection Lifecycle ===
    // Prevent connection leaks by recycling after N uses
    // Recommended: 7500 for production
    maxUses: config.NODE_ENV === "production" ? 7500 : 1000,

    // Minimum connections to maintain
    min:
        config.NODE_ENV === "production"
            ? 5
            : config.NODE_ENV === "test"
              ? 2
              : 2,

    // Query-level timeout (25 seconds)
    query_timeout: 25000,

    // === Query Timeouts ===
    // Maximum time for any single statement (30 seconds)
    // Prevents runaway queries from blocking the pool
    statement_timeout: 30000,
};

/**
 * Determine if we should auto-run migrations on initialization
 */
const shouldRunMigrations = (): boolean => {
    if (config.NODE_ENV === "test") {
        return false; // setup.ts handles migrations
    }
    return config.DB_RUN_MIGRATIONS_ON_STARTUP;
};

/**
 * Get logging configuration based on environment
 */
const getLogging = (): boolean | LogLevel[] => {
    if (!config.DB_LOGGING) {
        return false;
    }

    if (config.DB_LOGGING_LEVELS) {
        const levels = config.DB_LOGGING_LEVELS.split(",").map(
            (s) => s.trim() as LogLevel,
        );
        return levels.length > 0 ? levels : false;
    }

    switch (config.NODE_ENV) {
        case "development":
            return [
                "query",
                "error",
                "warn",
                "info",
                "log",
                "schema",
                "migration",
            ];
        case "production":
            return ["error", "warn"];
        case "staging":
            return ["query", "error", "warn", "info"];
        default:
            return false;
    }
};

/**
 * Redis configuration for TypeORM query result cache
 */
const typeormRedisConfig = {
    db: config.REDIS_DB,
    host: config.REDIS_HOST,
    password: config.REDIS_USER_PASSWORD,
    port: config.REDIS_PORT,
    username: config.REDIS_USERNAME,
} as const;

/**
 * Production-optimized PostgreSQL DataSource configuration
 */
const postgresConnectionOptions: PostgresConnectionOptions = {
    // === Query Result Cache ===
    cache: {
        alwaysEnabled: false, // Only cache when explicitly requested
        duration: 60 * 60 * 1000, // 1 hour default cache duration
        ignoreErrors: true, // Don't fail queries if cache is down
        options: typeormRedisConfig,
        tableName: "query_result_cache",
        type: "ioredis",
    },
    // === Connection Timeout ===
    // Initial connection timeout (10 seconds)
    connectTimeoutMS: 10000,
    database: config.POSTGRES_DB,
    // === Entities ===
    entities: [
        AcademicPerformanceEntity,
        AdmissionEntity,
        AptitudeExamEntity,
        AwardEntity,
        CertificationEntity,
        ConductEntity,
        FileEntity,
        MajorGroupEntity,
        MajorEntity,
        NationalExamEntity,
        OcrResultEntity,
        PredictionResultEntity,
        StudentAdmissionEntity,
        StudentMajorGroupEntity,
        StudentEntity,
        TalentExamEntity,
        TranscriptSubjectEntity,
        TranscriptEntity,
        VnuhcmScoreComponentEntity,
        VsatExamEntity,
        UserEntity,
        L2Entity,
        TranscriptSubjectGroupEntity,
        UniL1Entity,
    ],
    // === Connection Pool ===
    extra: poolConfig,
    host: config.POSTGRES_HOST,

    // === Extensions ===
    // Auto-install required PostgreSQL extensions
    installExtensions: config.NODE_ENV !== "production",

    // === Logging ===
    logging: getLogging(),

    logNotifications: config.NODE_ENV === "development",

    // === Query Performance ===
    // Log slow queries (5 seconds threshold)
    maxQueryExecutionTime: 5000,

    // === Migrations ===
    migrations: [
        CreateSchemas1754794900000,
        InitialSchema1754794905473,
        CreateDefaultAdmin1754794920377,
        MajorData1755086125584,
        AdmissionData1757342612756,
        L2Data1760411108656,
        TranscriptSubjectGroup1760934064921,
        UniItemL1Data1761452875227,
        Transcript1764903586789,
        MigrateUuidFromUUIDV4ToUUIDV71769316140669,
        ExamTypeChange1769859209514,
    ],

    migrationsRun: shouldRunMigrations(),

    migrationsTableName: "typeorm_migrations",

    migrationsTransactionMode: "all", // Run all migrations in single transaction
    // === Integer Handling ===
    // Parse PostgreSQL bigint (int8) as JavaScript number
    // WARNING: Only safe for values up to Number.MAX_SAFE_INTEGER (2^53)
    parseInt8: false, // Keep as string by default for safety

    password: config.POSTGRES_PASSWORD,

    port: config.POSTGRES_PORT,

    // === Schema ===
    // Use 'public' schema by default (can be overridden)
    schema: "public",
    // === Subscribers ===
    subscribers: [],
    // === Schema Synchronization ===
    // CRITICAL: Never enable in production!
    synchronize: config.DB_SYNCHRONIZE,
    // === Database Connection ===
    type: "postgres",

    username: config.POSTGRES_USER,

    // === Time Handling ===
    // Parse dates in UTC (recommended for consistency)
    useUTC: true,

    // === UUID Generation ===
    uuidExtension: "uuid-ossp",
};

export const postgresDataSource = new DataSource(postgresConnectionOptions);
