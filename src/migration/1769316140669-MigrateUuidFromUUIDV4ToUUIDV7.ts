import type { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateUuidFromUUIDV4ToUUIDV71769316140669 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to uuid_generate_v4()

        // Security schema
        await queryRunner.query(`
            ALTER TABLE "security"."users" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        // Uni_guide schema
        await queryRunner.query(`
            ALTER TABLE "uni_guide"."students" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."student_admissions" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."ocr_results" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."majors" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."files" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."prediction_results" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."admissions" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."major_groups" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."student_major_groups" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."vnuhcm_score_components" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."conducts" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."awards" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."academic_performances" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."vsat_exams" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."talent_exams" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."national_exams" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."certifications" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."aptitude_exams" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."transcripts" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."transcript_subjects" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        // Machine_learning schema
        await queryRunner.query(`
            ALTER TABLE "machine_learning"."transcript_subject_group" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "machine_learning"."uni_l1" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);

        await queryRunner.query(`
            ALTER TABLE "machine_learning"."l2_uni_requirement" 
            ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()
        `);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change DEFAULT for all UUID columns to use uuidv7()
        // PostgreSQL 18+ has built-in uuidv7() function

        // Security schema
        await queryRunner.query(`
            ALTER TABLE "security"."users" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        // Uni_guide schema
        await queryRunner.query(`
            ALTER TABLE "uni_guide"."students" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."student_admissions" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."ocr_results" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."majors" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."files" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."prediction_results" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."admissions" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."major_groups" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."student_major_groups" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."vnuhcm_score_components" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."conducts" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."awards" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."academic_performances" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."vsat_exams" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."talent_exams" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."national_exams" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."certifications" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."aptitude_exams" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."transcripts" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "uni_guide"."transcript_subjects" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        // Machine_learning schema
        await queryRunner.query(`
            ALTER TABLE "machine_learning"."transcript_subject_group" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "machine_learning"."uni_l1" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);

        await queryRunner.query(`
            ALTER TABLE "machine_learning"."l2_uni_requirement" 
            ALTER COLUMN "id" SET DEFAULT uuidv7()
        `);
    }
}
