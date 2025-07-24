// src/data.source.ts
import { DataSource } from "typeorm";

import { PostEntity } from "@/entity/post.js";
import { UserEntity } from "@/entity/user.js";

export const AppDataSource = new DataSource({
    database: process.env.POSTGRES_DB,
    entities: [PostEntity, UserEntity],
    host: process.env.POSTGRES_HOST,
    logging: process.env.DB_LOGGING === "true",
    migrations: [],
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
        ? parseInt(process.env.POSTGRES_PORT)
        : 5432,
    subscribers: [],
    synchronize: process.env.DB_SYNCHRONIZE === "true",
    type: "postgres",
    username: process.env.POSTGRES_USER,
});
