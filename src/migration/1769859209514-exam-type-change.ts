import type { MigrationInterface, QueryRunner } from "typeorm";

export class ExamTypeChange1769859209514 implements MigrationInterface {
    name = "ExamTypeChange1769859209514";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."certifications_exam_type_enum_old" AS ENUM('Alevel', 'ACT', 'DoulingoEnglishTest', 'HSA', 'IB', 'IELTS', 'JLPT', 'OSSD', 'PTEAcademic', 'SAT', 'TOEFL CBT', 'TOEFL iBT', 'TOEFL Paper', 'TOEIC', 'TSA', 'VNUHCM')`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."certifications" ALTER COLUMN "exam_type" TYPE "uni_guide"."certifications_exam_type_enum_old" USING "exam_type"::"text"::"uni_guide"."certifications_exam_type_enum_old"`,
        );
        await queryRunner.query(
            `DROP TYPE "uni_guide"."certifications_exam_type_enum"`,
        );
        await queryRunner.query(
            `ALTER TYPE "uni_guide"."certifications_exam_type_enum_old" RENAME TO "certifications_exam_type_enum"`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."aptitude_exams_exam_type_enum_old" AS ENUM('Alevel', 'ACT', 'DoulingoEnglishTest', 'HSA', 'IB', 'IELTS', 'JLPT', 'OSSD', 'PTEAcademic', 'SAT', 'TOEFL CBT', 'TOEFL iBT', 'TOEFL Paper', 'TOEIC', 'TSA', 'VNUHCM')`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."aptitude_exams" ALTER COLUMN "exam_type" TYPE "uni_guide"."aptitude_exams_exam_type_enum_old" USING "exam_type"::"text"::"uni_guide"."aptitude_exams_exam_type_enum_old"`,
        );
        await queryRunner.query(
            `DROP TYPE "uni_guide"."aptitude_exams_exam_type_enum"`,
        );
        await queryRunner.query(
            `ALTER TYPE "uni_guide"."aptitude_exams_exam_type_enum_old" RENAME TO "aptitude_exams_exam_type_enum"`,
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "uni_guide"."aptitude_exams_exam_type_enum" RENAME TO "aptitude_exams_exam_type_enum_old"`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."aptitude_exams_exam_type_enum" AS ENUM('HSA', 'TSA', 'VNUHCM')`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."aptitude_exams" ALTER COLUMN "exam_type" TYPE "uni_guide"."aptitude_exams_exam_type_enum" USING "exam_type"::"text"::"uni_guide"."aptitude_exams_exam_type_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE "uni_guide"."aptitude_exams_exam_type_enum_old"`,
        );
        await queryRunner.query(
            `ALTER TYPE "uni_guide"."certifications_exam_type_enum" RENAME TO "certifications_exam_type_enum_old"`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."certifications_exam_type_enum" AS ENUM('IELTS', 'JLPT', 'TOEFL CBT', 'TOEFL iBT', 'TOEFL Paper', 'TOEIC', 'Alevel', 'ACT', 'DoulingoEnglishTest', 'IB', 'OSSD', 'PTEAcademic', 'SAT')`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."certifications" ALTER COLUMN "exam_type" TYPE "uni_guide"."certifications_exam_type_enum" USING "exam_type"::"text"::"uni_guide"."certifications_exam_type_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE "uni_guide"."certifications_exam_type_enum_old"`,
        );
    }
}
