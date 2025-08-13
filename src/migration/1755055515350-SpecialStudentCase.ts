import { MigrationInterface, QueryRunner } from "typeorm";

export class SpecialStudentCase1755055515350 implements MigrationInterface {
    name = "SpecialStudentCase1755055515350";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "students" ADD "specialStudentCase" character varying(255)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "specialStudentCase"`,
        );
    }
}
