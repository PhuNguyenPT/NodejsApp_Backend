import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSchemas1754794900000 implements MigrationInterface {
    name = "CreateSchemas1754794900000";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP SCHEMA IF EXISTS "security" CASCADE`);
        await queryRunner.query(
            `DROP SCHEMA IF EXISTS "machine_learning" CASCADE`,
        );
        await queryRunner.query(`DROP SCHEMA IF EXISTS "uni_guide" CASCADE`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "uni_guide"`);
        await queryRunner.query(
            `CREATE SCHEMA IF NOT EXISTS "machine_learning"`,
        );
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "security"`);
    }
}
