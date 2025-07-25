import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1753416703809 implements MigrationInterface {
    name = "InitialSchema1753416703809";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "posts" ("body" character varying(255) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "modifiedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modifiedBy" character varying, "title" character varying(255) NOT NULL, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'ANONYMOUS', 'MODERATOR', 'USER')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."users_status_enum" AS ENUM('Happy', 'Sad')`,
        );
        await queryRunner.query(
            `CREATE TABLE "users" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying(255), "email" character varying(255) NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "modifiedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modifiedBy" character varying(255), "name" character varying(255), "password" character varying(128) NOT NULL, "permissions" text, "phoneNumbers" text, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "status" "public"."users_status_enum" NOT NULL DEFAULT 'Happy', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_role" ON "users" ("role") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_status" ON "users" ("status") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_email" ON "users" ("email") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_id_name" ON "users" ("id", "name") `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_user_id_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_role"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "posts"`);
    }
}
