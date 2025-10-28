import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVectorUniL11761450783882 implements MigrationInterface {
    /**
     * IMPORTANT: This column is manually managed as vector(65) in PostgreSQL.
     * The entity definition uses 'text' type to prevent TypeORM from
     * auto-generating conflicting migrations.
     *
     * DO NOT auto-generate migrations for this table without reviewing!
     */

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "machine_learning"."uni_l1" 
             ALTER COLUMN "tfidf_content" TYPE text 
             USING tfidf_content::text`,
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

        await queryRunner.query(
            `ALTER TABLE "machine_learning"."uni_l1" 
             ALTER COLUMN "tfidf_content" TYPE vector(65) 
             USING NULL`,
        );
    }
}
