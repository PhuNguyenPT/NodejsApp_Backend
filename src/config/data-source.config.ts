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
import { config } from "@/util/validate-env.js";

/**
 * Get logging configuration based on environment and configuration
 */
const getLogging = (): boolean | LogLevel[] => {
    if (!config.DB_LOGGING) {
        return false;
    }

    // If custom levels are specified, use them
    if (config.DB_LOGGING_LEVELS) {
        const levels = config.DB_LOGGING_LEVELS.split(",").map(
            (s) => s.trim() as LogLevel,
        );

        return levels.length > 0 ? levels : false;
    }

    // Otherwise, auto-detect based on NODE_ENV
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

// Redis configuration for TypeORM cache using ioredis
const typeormRedisConfig = {
    db: config.REDIS_DB,
    host: config.REDIS_HOST,
    password: config.REDIS_USER_PASSWORD,
    port: config.REDIS_PORT,
    username: config.REDIS_USERNAME,
} as const;

// PostgreSQL DataSource configuration
const postgresConnectionOptions: PostgresConnectionOptions = {
    // Query result cache using Redis
    cache: {
        duration: 60 * 60 * 1000, // 1 hour
        options: typeormRedisConfig,
        tableName: "query_result_cache",
        type: "ioredis",
    },
    // PostgreSQL-specific connection timeout
    connectTimeoutMS: 10000, // 10 seconds max to establish connection
    database: config.POSTGRES_DB,
    // Entity and migration configuration
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
    // PostgreSQL connection pool options (pg driver options)
    extra: {
        idleTimeoutMillis: 10000, // 10 seconds idle timeout
        max: 20, // Maximum pool size
        min: 5, // Minimum pool size
    },
    host: config.POSTGRES_HOST,

    // Logging configuration
    logging: getLogging(),
    maxQueryExecutionTime: 5000,
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
    ],

    // Migration settings
    migrationsRun: config.DB_RUN_MIGRATIONS_ON_STARTUP,
    migrationsTableName: "typeorm_migrations",
    password: config.POSTGRES_PASSWORD,

    port: config.POSTGRES_PORT,
    subscribers: [],

    synchronize: config.DB_SYNCHRONIZE,

    type: "postgres",

    username: config.POSTGRES_USER,
};

export const postgresDataSource = new DataSource(postgresConnectionOptions);
