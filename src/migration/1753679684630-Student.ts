import { MigrationInterface, QueryRunner } from "typeorm";

export class Student1753679684630 implements MigrationInterface {
    name = "Student1753679684630";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "students" DROP CONSTRAINT "FK_e0208b4f964e609959aff431bf9"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ALTER COLUMN "createdBy" SET DEFAULT 'ANONYMOUS'`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ALTER COLUMN "modifiedBy" SET DEFAULT 'ANONYMOUS'`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ALTER COLUMN "userId" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD CONSTRAINT "FK_e0208b4f964e609959aff431bf9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "students" DROP CONSTRAINT "FK_e0208b4f964e609959aff431bf9"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ALTER COLUMN "userId" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ALTER COLUMN "modifiedBy" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ALTER COLUMN "createdBy" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD CONSTRAINT "FK_e0208b4f964e609959aff431bf9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }
}
