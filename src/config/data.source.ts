// src/config/data.source.ts
import { DataSource } from "typeorm";

import { AwardEntity } from "@/entity/award.js";
import { CertificationEntity } from "@/entity/certification.js";
import { FileEntity } from "@/entity/file.js";
import { MajorEntity } from "@/entity/major.entity.js";
import { MajorGroupEntity } from "@/entity/major.group.entity.js";
import { OcrResultEntity } from "@/entity/ocr.result.entity.js";
import { PostEntity } from "@/entity/post.js";
import { StudentEntity } from "@/entity/student.js";
import { UserEntity } from "@/entity/user.js";
import logger from "@/util/logger.js";
import { config } from "@/util/validate.env.js";

export const postgresDataSource = new DataSource({
    database: config.POSTGRES_DB,
    entities: [
        PostEntity,
        UserEntity,
        CertificationEntity,
        AwardEntity,
        StudentEntity,
        FileEntity,
        MajorEntity,
        MajorGroupEntity,
        OcrResultEntity,
    ],
    host: config.POSTGRES_HOST,
    logging: config.DB_LOGGING,
    migrations: [
        config.NODE_ENV === "development"
            ? "src/migration/*.ts"
            : "dist/migration/*.js",
    ],
    migrationsRun: config.DB_RUN_MIGRATIONS_ON_STARTUP,
    migrationsTableName: "typeorm_migrations",
    password: config.POSTGRES_PASSWORD,
    port: config.POSTGRES_PORT,
    subscribers: [],
    synchronize: config.DB_SYNCHRONIZE,
    type: "postgres",
    username: config.POSTGRES_USER,
});

// Initialize PostgreSQL connection
export const initializePostgreSQL = async (): Promise<void> => {
    logger.info("Connecting to PostgreSQL...");

    try {
        await postgresDataSource.initialize();
        logger.info("✅ PostgreSQL connection established successfully");

        // Test the connection with a simple query
        await postgresDataSource.query("SELECT 1");
        logger.info("✅ PostgreSQL connection test passed");
    } catch (error) {
        logger.error("❌ Failed to initialize PostgreSQL connection:", error);
        throw error;
    }
};
