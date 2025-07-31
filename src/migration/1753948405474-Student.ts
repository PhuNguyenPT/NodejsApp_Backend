import { MigrationInterface, QueryRunner } from "typeorm";

export class Student1753948405474 implements MigrationInterface {
    name = "Student1753948405474";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "students" ADD "aptitudeTestScore" numeric(5,2)`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD "subjectCombination" json`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD "vsatScore" numeric(5,2)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "vsatScore"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "subjectCombination"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "aptitudeTestScore"`,
        );
    }
}
