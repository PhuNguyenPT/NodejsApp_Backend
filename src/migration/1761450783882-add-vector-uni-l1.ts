import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVectorUniL11761450783882 implements MigrationInterface {
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
