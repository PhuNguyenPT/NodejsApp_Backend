import { MigrationInterface, QueryRunner } from "typeorm";

export class AcademicPerformanceConduct1755060791287
    implements MigrationInterface
{
    name = "AcademicPerformanceConduct1755060791287";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "students" ADD "academicPerformances" jsonb`,
        );
        await queryRunner.query(`ALTER TABLE "students" ADD "conducts" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "conducts"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "academicPerformances"`,
        );
    }
}
