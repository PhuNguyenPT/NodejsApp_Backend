// src/config/data.source.ts
import { DataSource } from "typeorm";

import { AwardEntity } from "@/entity/award";
import { CertificationEntity } from "@/entity/certification";
import { PostEntity } from "@/entity/post.js";
import { StudentEntity } from "@/entity/student";
import { UserEntity } from "@/entity/user.js";
import { config } from "@/util/validate.env.js";

export const AppDataSource = new DataSource({
    database: config.POSTGRES_DB,
    entities: [
        PostEntity,
        UserEntity,
        CertificationEntity,
        AwardEntity,
        StudentEntity,
    ],
    host: config.POSTGRES_HOST,
    logging: config.DB_LOGGING,
    migrations: [
        config.NODE_ENV === "development"
            ? "src/migration/*.ts"
            : "dist/migration/*.js",
    ],
    migrationsRun: config.RUN_MIGRATIONS_ON_STARTUP,
    migrationsTableName: "typeorm_migrations",
    password: config.POSTGRES_PASSWORD,
    port: config.POSTGRES_PORT,
    subscribers: [],
    synchronize: config.DB_SYNCHRONIZE,
    type: "postgres",
    username: config.POSTGRES_USER,
});
