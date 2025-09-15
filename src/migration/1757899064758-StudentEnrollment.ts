import { MigrationInterface, QueryRunner } from "typeorm";

export class StudentEnrollment1757899064758 implements MigrationInterface {
    name = "StudentEnrollment1757899064758";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "student_enrollments" DROP CONSTRAINT "FK_f30c325194ec4771788c99bc97e"`,
        );
        await queryRunner.query(
            `ALTER TABLE "student_enrollments" DROP CONSTRAINT "FK_08caafd8a026a19ecf54db0e958"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_f30c325194ec4771788c99bc97"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_08caafd8a026a19ecf54db0e95"`,
        );
        await queryRunner.query(`DROP TABLE "student_enrollments"`);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "student_enrollments" ("student_id" uuid NOT NULL, "enrollment_id" uuid NOT NULL, CONSTRAINT "PK_e2faf54ce1791979a3159bc6ddf" PRIMARY KEY ("student_id", "enrollment_id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_08caafd8a026a19ecf54db0e95" ON "student_enrollments" ("student_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_f30c325194ec4771788c99bc97" ON "student_enrollments" ("enrollment_id") `,
        );
        await queryRunner.query(
            `ALTER TABLE "student_enrollments" ADD CONSTRAINT "FK_08caafd8a026a19ecf54db0e958" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "student_enrollments" ADD CONSTRAINT "FK_f30c325194ec4771788c99bc97e" FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
    }
}
