import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSchemas1754794900000 implements MigrationInterface {
    name = "CreateSchemas1754794900000";

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop schemas in reverse order
        // Use CASCADE to drop all objects in the schemas
        await queryRunner.query(`DROP SCHEMA IF EXISTS "security" CASCADE`);
        await queryRunner.query(
            `DROP SCHEMA IF EXISTS "machine_learning" CASCADE`,
        );
        await queryRunner.query(`DROP SCHEMA IF EXISTS "uni_guide" CASCADE`);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        // Create schemas if they don't exist
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "uni_guide"`);
        await queryRunner.query(
            `CREATE SCHEMA IF NOT EXISTS "machine_learning"`,
        );
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "security"`);
    }
}
