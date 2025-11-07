import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVectorColumn1762481000000 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "machine_learning"."uni_l1" 
             DROP COLUMN IF EXISTS "tfidf_content"`,
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        await queryRunner.query(
            `ALTER TABLE "machine_learning"."uni_l1" 
             ADD COLUMN IF NOT EXISTS "tfidf_content" vector(65)`,
        );
    }
}
