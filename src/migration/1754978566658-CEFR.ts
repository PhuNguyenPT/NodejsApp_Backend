import { MigrationInterface, QueryRunner } from "typeorm";

export class CEFR1754978566658 implements MigrationInterface {
    name = "CEFR1754978566658";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."certifications_cefr_enum" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2')`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" ADD "cefr" "public"."certifications_cefr_enum"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "certifications" DROP COLUMN "cefr"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."certifications_cefr_enum"`,
        );
    }
}
