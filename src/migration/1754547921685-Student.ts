import { MigrationInterface, QueryRunner } from "typeorm";

export class Student1754547921685 implements MigrationInterface {
    name = "Student1754547921685";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_student_vsat_score"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_student_aptitude_test_score"`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" ADD "examType" jsonb`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD "talentScore" numeric(4,2)`,
        );
        await queryRunner.query(`ALTER TABLE "awards" ADD "examType" jsonb`);
        await queryRunner.query(
            `ALTER TABLE "certifications" ALTER COLUMN "expirationDate" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" ALTER COLUMN "issueDate" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" ALTER COLUMN "level" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" ALTER COLUMN "name" DROP NOT NULL`,
        );
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "metadata" jsonb`);
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "aptitudeTestScore"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD "aptitudeTestScore" jsonb`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "subjectCombination"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD "subjectCombination" jsonb`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "vsatScore"`,
        );
        await queryRunner.query(`ALTER TABLE "students" ADD "vsatScore" jsonb`);
        await queryRunner.query(
            `ALTER TABLE "awards" ALTER COLUMN "category" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "awards" ALTER COLUMN "level" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "awards" ALTER COLUMN "name" DROP NOT NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_talent_score" ON "students" ("talentScore") `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "public"."idx_student_talent_score"`,
        );
        await queryRunner.query(
            `ALTER TABLE "awards" ALTER COLUMN "name" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "awards" ALTER COLUMN "level" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "awards" ALTER COLUMN "category" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "vsatScore"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD "vsatScore" numeric(5,2)`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "subjectCombination"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD "subjectCombination" json`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "aptitudeTestScore"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD "aptitudeTestScore" numeric(5,2)`,
        );
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "metadata" json`);
        await queryRunner.query(
            `ALTER TABLE "certifications" ALTER COLUMN "name" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" ALTER COLUMN "level" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" ALTER COLUMN "issueDate" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" ALTER COLUMN "expirationDate" SET NOT NULL`,
        );
        await queryRunner.query(`ALTER TABLE "awards" DROP COLUMN "examType"`);
        await queryRunner.query(
            `ALTER TABLE "students" DROP COLUMN "talentScore"`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" DROP COLUMN "examType"`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_aptitude_test_score" ON "students" ("aptitudeTestScore") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_vsat_score" ON "students" ("vsatScore") `,
        );
    }
}
