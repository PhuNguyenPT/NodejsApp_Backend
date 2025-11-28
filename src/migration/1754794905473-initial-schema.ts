import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1754794905473 implements MigrationInterface {
    name = "InitialSchema1754794905473";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."aptitude_exams" DROP CONSTRAINT "FK_82ae288fe4339351102e4b54ae3"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."certifications" DROP CONSTRAINT "FK_a6e2e7c5253997c79b6c95877f8"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."national_exams" DROP CONSTRAINT "FK_8274cadd00af462260b130a40de"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."talent_exams" DROP CONSTRAINT "FK_f33a0f11ceafab728ce046b115a"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."vsat_exams" DROP CONSTRAINT "FK_51d6b2e05e7f7cd4879a26e21b0"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."academic_performances" DROP CONSTRAINT "FK_2b3904256576d80568b0209e545"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."awards" DROP CONSTRAINT "FK_dda79d41e0a8fe0335ee01f67a6"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."conducts" DROP CONSTRAINT "FK_47bc9143f2d32258a71078a83aa"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."files" DROP CONSTRAINT "FK_48835644dda7c2d24fee3654081"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."majors" DROP CONSTRAINT "FK_10c322c60cd25c2c170a3302033"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."students" DROP CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."student_major_groups" DROP CONSTRAINT "FK_b4b7e67064e4ac35b50bd19a59e"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."student_major_groups" DROP CONSTRAINT "FK_80f55c50a4aee989a2ed83a681c"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."vnuhcm_score_components" DROP CONSTRAINT "FK_be171050332cabbc4b4ddb985e0"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."ocr_results" DROP CONSTRAINT "FK_f15a8dceb9fb656e7eeb1fe4808"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."ocr_results" DROP CONSTRAINT "FK_8ed776072e6522a1fbef9818330"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."prediction_results" DROP CONSTRAINT "FK_d9fc83e5d611a8aaf7161e10d0b"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."student_admissions" DROP CONSTRAINT "FK_223f964a2fff3f7a45610f43ded"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."student_admissions" DROP CONSTRAINT "FK_794414569ff641b86139a029912"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."aptitude_exams"`);
        await queryRunner.query(
            `DROP TYPE "uni_guide"."aptitude_exams_exam_type_enum"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_certification_student_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_certification_cefr"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_certification_level"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_certification_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_certification_updated_at"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."certifications"`);
        await queryRunner.query(
            `DROP TYPE "uni_guide"."certifications_exam_type_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE "uni_guide"."certifications_cefr_enum"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."national_exams"`);
        await queryRunner.query(`DROP TABLE "uni_guide"."talent_exams"`);
        await queryRunner.query(`DROP TABLE "uni_guide"."vsat_exams"`);
        await queryRunner.query(
            `DROP TABLE "uni_guide"."academic_performances"`,
        );
        await queryRunner.query(
            `DROP TYPE "uni_guide"."academic_performances_academic_performance_enum"`,
        );
        await queryRunner.query(`DROP INDEX "security"."idx_user_id_name"`);
        await queryRunner.query(`DROP INDEX "security"."idx_user_email"`);
        await queryRunner.query(`DROP INDEX "security"."idx_user_role"`);
        await queryRunner.query(
            `DROP INDEX "security"."idx_user_account_status"`,
        );
        await queryRunner.query(`DROP INDEX "security"."idx_user_created_at"`);
        await queryRunner.query(`DROP INDEX "security"."idx_user_updated_at"`);
        await queryRunner.query(`DROP INDEX "security"."idx_user_permissions"`);
        await queryRunner.query(
            `DROP INDEX "security"."idx_user_phone_numbers"`,
        );
        await queryRunner.query(`DROP TABLE "security"."users"`);
        await queryRunner.query(`DROP TYPE "security"."users_role_enum"`);
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_major_groups_code"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_major_groups_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_major_groups_english_name"`,
        );
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_major_groups_id"`);
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_major_groups_name"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_major_groups_updated_at"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."major_groups"`);
        await queryRunner.query(
            `DROP TYPE "uni_guide"."major_groups_name_enum"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_award_student_id"`,
        );
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_award_category"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_award_level"`);
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_award_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_award_updated_at"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."awards"`);
        await queryRunner.query(`DROP TYPE "uni_guide"."awards_name_enum"`);
        await queryRunner.query(`DROP TYPE "uni_guide"."awards_level_enum"`);
        await queryRunner.query(`DROP TYPE "uni_guide"."awards_category_enum"`);
        await queryRunner.query(`DROP TABLE "uni_guide"."conducts"`);
        await queryRunner.query(
            `DROP TYPE "uni_guide"."conducts_conduct_enum"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_tsg_major_code"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_tsg_uni_code"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_tsg_subject_combination"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_tsg_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_tsg_updated_at"`,
        );
        await queryRunner.query(
            `DROP TABLE "machine_learning"."transcript_subject_group"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_academic_performance_grade_10"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_academic_performance_grade_11"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_academic_performance_grade_12"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_admission_code"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_certification_name"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_certification_score"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_certification_score_equivalence"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_conduct_grade_10"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_conduct_grade_11"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_conduct_grade_12"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_is_base_row"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_major_code"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_province"`,
        );
        await queryRunner.query(`DROP INDEX "machine_learning"."idx_l2_score"`);
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_score_final"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_subject_combination"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_tuition_fee"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_uni_type_label"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_y_base"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "machine_learning"."idx_l2_updated_at"`,
        );
        await queryRunner.query(
            `DROP TABLE "machine_learning"."l2_uni_requirement"`,
        );
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_admissions_code"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_admissions_type"`);
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_major_code"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_major_name"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_province"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_study_program"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_uni_code"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_uni_name"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_uni_type"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_tuition_fee"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_uni_major"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_province_uni_type"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_admission_type_major"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_study_program_admission_type"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_province_tuition_fee"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_uni_type_tuition_fee"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_admissions_updated_at"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."admissions"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_file_student_id"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_file_type"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_file_status"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_file_created_at"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_file_updated_at"`);
        await queryRunner.query(`DROP TABLE "uni_guide"."files"`);
        await queryRunner.query(`DROP TYPE "uni_guide"."files_status_enum"`);
        await queryRunner.query(`DROP TYPE "uni_guide"."files_file_type_enum"`);
        await queryRunner.query(`DROP TABLE "uni_guide"."majors"`);
        await queryRunner.query(`DROP TABLE "machine_learning"."uni_l1"`);
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_students_user_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_students_province"`,
        );
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_students_budget"`);
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_students_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_students_created_by"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_students_updated_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_students_updated_by"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."students"`);
        await queryRunner.query(
            `DROP TYPE "uni_guide"."students_uni_type_enum"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_student_major_groups_student_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_student_major_groups_major_group_id"`,
        );
        await queryRunner.query(
            `DROP TABLE "uni_guide"."student_major_groups"`,
        );
        await queryRunner.query(
            `DROP TABLE "uni_guide"."vnuhcm_score_components"`,
        );
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_ocr_student_id"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_ocr_file_id"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_ocr_status"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_ocr_created_at"`);
        await queryRunner.query(`DROP INDEX "uni_guide"."idx_ocr_updated_at"`);
        await queryRunner.query(`DROP TABLE "uni_guide"."ocr_results"`);
        await queryRunner.query(
            `DROP TYPE "uni_guide"."ocr_results_status_enum"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_prediction_results_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_prediction_results_created_by"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_prediction_results_status"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_prediction_results_student_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_prediction_results_updated_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_prediction_results_updated_by"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."prediction_results"`);
        await queryRunner.query(
            `DROP TYPE "uni_guide"."prediction_results_status_enum"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_student_admissions_student_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_student_admissions_admission_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_student_admissions_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_student_admissions_created_by"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_student_admissions_updated_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "uni_guide"."idx_student_admissions_updated_by"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."student_admissions"`);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."student_admissions" ("admission_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "uq_student_admission" UNIQUE ("student_id", "admission_id"), CONSTRAINT "PK_28566988c92be41022acf22bdf3" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_updated_by" ON "uni_guide"."student_admissions" ("updated_by") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_updated_at" ON "uni_guide"."student_admissions" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_created_by" ON "uni_guide"."student_admissions" ("created_by") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_created_at" ON "uni_guide"."student_admissions" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_admission_id" ON "uni_guide"."student_admissions" ("admission_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_student_id" ON "uni_guide"."student_admissions" ("student_id") `,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."prediction_results_status_enum" AS ENUM('completed', 'failed', 'partial', 'processing')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."prediction_results" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "l1_predict_results" jsonb, "l2_predict_results" jsonb, "status" "uni_guide"."prediction_results_status_enum" NOT NULL, "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying, CONSTRAINT "REL_d9fc83e5d611a8aaf7161e10d0" UNIQUE ("student_id"), CONSTRAINT "PK_44ca49774e1883302d08cb1e0fa" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_updated_by" ON "uni_guide"."prediction_results" ("updated_by") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_updated_at" ON "uni_guide"."prediction_results" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_student_id" ON "uni_guide"."prediction_results" ("student_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_status" ON "uni_guide"."prediction_results" ("status") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_created_by" ON "uni_guide"."prediction_results" ("created_by") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_created_at" ON "uni_guide"."prediction_results" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."ocr_results_status_enum" AS ENUM('completed', 'failed', 'processing')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."ocr_results" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "document_annotation" text, "error_message" text, "file_id" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "metadata" jsonb, "scores" jsonb, "status" "uni_guide"."ocr_results_status_enum" NOT NULL, "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "uq_ocr_student_file" UNIQUE ("student_id", "file_id"), CONSTRAINT "REL_8ed776072e6522a1fbef981833" UNIQUE ("file_id"), CONSTRAINT "PK_562c4e52268d72e5b1a6833beb5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_updated_at" ON "uni_guide"."ocr_results" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_created_at" ON "uni_guide"."ocr_results" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_status" ON "uni_guide"."ocr_results" ("status") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_file_id" ON "uni_guide"."ocr_results" ("file_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_student_id" ON "uni_guide"."ocr_results" ("student_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."vnuhcm_score_components" ("aptitude_exam_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "language_score" integer NOT NULL, "math_score" integer NOT NULL, "science_logic" integer NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "REL_be171050332cabbc4b4ddb985e" UNIQUE ("aptitude_exam_id"), CONSTRAINT "PK_2ad5dbce0000d1a8ed11de5f926" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."student_major_groups" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "major_group_id" uuid NOT NULL, "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "uq_student_major_groups" UNIQUE ("student_id", "major_group_id"), CONSTRAINT "PK_2c6b187a59d1d59e3b4b24c662e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_major_groups_major_group_id" ON "uni_guide"."student_major_groups" ("major_group_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_major_groups_student_id" ON "uni_guide"."student_major_groups" ("student_id") `,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."students_uni_type_enum" AS ENUM('Tư thục', 'Công lập')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."students" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "majors" jsonb, "max_budget" numeric(14,2), "min_budget" numeric(14,2), "province" character varying, "special_student_cases" jsonb, "uni_type" "uni_guide"."students_uni_type_enum", "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), "user_id" uuid, CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_updated_by" ON "uni_guide"."students" ("updated_by") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_updated_at" ON "uni_guide"."students" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_created_by" ON "uni_guide"."students" ("created_by") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_created_at" ON "uni_guide"."students" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_budget" ON "uni_guide"."students" ("min_budget", "max_budget") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_province" ON "uni_guide"."students" ("province") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_user_id" ON "uni_guide"."students" ("user_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "machine_learning"."uni_l1" ("admission_code" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tfidf_content" vector(65), "tuition_fee" numeric, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_44be078a5009cc7dd612b8f68f4" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."majors" ("code" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "group_id" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b287db61b00b45e58c854f19da" UNIQUE ("code"), CONSTRAINT "PK_9d82cf80fe0593040e50ccb297e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."files_file_type_enum" AS ENUM('certificate', 'document', 'image', 'other', 'portfolio', 'resume', 'transcript')`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."files_status_enum" AS ENUM('active', 'archived', 'deleted')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."files" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "description" character varying(500), "file_content" bytea NOT NULL, "file_name" character varying(255) NOT NULL, "file_path" character varying(500), "file_size" bigint NOT NULL, "file_type" "uni_guide"."files_file_type_enum" NOT NULL DEFAULT 'other', "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "metadata" jsonb, "mime_type" character varying(100) NOT NULL, "original_file_name" character varying(255) NOT NULL, "status" "uni_guide"."files_status_enum" NOT NULL DEFAULT 'active', "student_id" uuid NOT NULL, "tags" character varying(255), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_file_updated_at" ON "uni_guide"."files" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_file_created_at" ON "uni_guide"."files" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_file_status" ON "uni_guide"."files" ("status") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_file_type" ON "uni_guide"."files" ("file_type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_file_student_id" ON "uni_guide"."files" ("student_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."admissions" ("admission_code" character varying, "admission_type" character varying, "admission_type_name" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "major_code" character varying, "major_group" integer, "major_name" character varying, "province" character varying, "score" numeric, "study_program" character varying, "subject_combination" character varying, "tuition_fee" bigint, "uni_code" character varying, "uni_name" character varying, "uni_type" character varying, "uni_web_link" character varying, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6d47682a899dfa0a78ce11fe98a" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_updated_at" ON "uni_guide"."admissions" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_created_at" ON "uni_guide"."admissions" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_uni_type_tuition_fee" ON "uni_guide"."admissions" ("uni_type", "tuition_fee") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_province_tuition_fee" ON "uni_guide"."admissions" ("province", "tuition_fee") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_study_program_admission_type" ON "uni_guide"."admissions" ("study_program", "admission_type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_admission_type_major" ON "uni_guide"."admissions" ("admission_type", "major_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_province_uni_type" ON "uni_guide"."admissions" ("province", "uni_type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_uni_major" ON "uni_guide"."admissions" ("uni_code", "major_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_tuition_fee" ON "uni_guide"."admissions" ("tuition_fee") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_uni_type" ON "uni_guide"."admissions" ("uni_type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_uni_name" ON "uni_guide"."admissions" ("uni_name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_uni_code" ON "uni_guide"."admissions" ("uni_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_study_program" ON "uni_guide"."admissions" ("study_program") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_province" ON "uni_guide"."admissions" ("province") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_major_name" ON "uni_guide"."admissions" ("major_name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_major_code" ON "uni_guide"."admissions" ("major_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_type" ON "uni_guide"."admissions" ("admission_type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_code" ON "uni_guide"."admissions" ("admission_code") `,
        );
        await queryRunner.query(
            `CREATE TABLE "machine_learning"."l2_uni_requirement" ("academic_performance_grade_10" integer, "academic_performance_grade_11" integer, "academic_performance_grade_12" integer, "admission_code" character varying, "certification_name" integer, "certification_score" integer, "certification_score_equivalence" integer, "conduct_grade_10" integer, "conduct_grade_11" integer, "conduct_grade_12" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "is_base_row" boolean, "major_code" integer, "province" character varying, "score" numeric, "score_final" numeric, "subject_combination" character varying, "tuition_fee" numeric, "uni_type_label" smallint, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "y_base" numeric, CONSTRAINT "PK_8de7bae2fd96ba7e808ccc8e236" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_updated_at" ON "machine_learning"."l2_uni_requirement" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_created_at" ON "machine_learning"."l2_uni_requirement" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_y_base" ON "machine_learning"."l2_uni_requirement" ("y_base") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_uni_type_label" ON "machine_learning"."l2_uni_requirement" ("uni_type_label") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_tuition_fee" ON "machine_learning"."l2_uni_requirement" ("tuition_fee") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_subject_combination" ON "machine_learning"."l2_uni_requirement" ("subject_combination") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_score_final" ON "machine_learning"."l2_uni_requirement" ("score_final") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_score" ON "machine_learning"."l2_uni_requirement" ("score") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_province" ON "machine_learning"."l2_uni_requirement" ("province") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_major_code" ON "machine_learning"."l2_uni_requirement" ("major_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_is_base_row" ON "machine_learning"."l2_uni_requirement" ("is_base_row") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_conduct_grade_12" ON "machine_learning"."l2_uni_requirement" ("conduct_grade_12") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_conduct_grade_11" ON "machine_learning"."l2_uni_requirement" ("conduct_grade_11") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_conduct_grade_10" ON "machine_learning"."l2_uni_requirement" ("conduct_grade_10") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_certification_score_equivalence" ON "machine_learning"."l2_uni_requirement" ("certification_score_equivalence") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_certification_score" ON "machine_learning"."l2_uni_requirement" ("certification_score") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_certification_name" ON "machine_learning"."l2_uni_requirement" ("certification_name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_admission_code" ON "machine_learning"."l2_uni_requirement" ("admission_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_academic_performance_grade_12" ON "machine_learning"."l2_uni_requirement" ("academic_performance_grade_12") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_academic_performance_grade_11" ON "machine_learning"."l2_uni_requirement" ("academic_performance_grade_11") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_l2_academic_performance_grade_10" ON "machine_learning"."l2_uni_requirement" ("academic_performance_grade_10") `,
        );
        await queryRunner.query(
            `CREATE TABLE "machine_learning"."transcript_subject_group" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "major_code" character varying, "subject_combination" character varying, "uni_code" character varying, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5e73487bc6e343ec891916e616c" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_tsg_updated_at" ON "machine_learning"."transcript_subject_group" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_tsg_created_at" ON "machine_learning"."transcript_subject_group" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_tsg_subject_combination" ON "machine_learning"."transcript_subject_group" ("subject_combination") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_tsg_uni_code" ON "machine_learning"."transcript_subject_group" ("uni_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_tsg_major_code" ON "machine_learning"."transcript_subject_group" ("major_code") `,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."conducts_conduct_enum" AS ENUM('Tốt', 'Chưa Đạt', 'Đạt', 'Khá')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."conducts" ("conduct" "uni_guide"."conducts_conduct_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "grade" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "PK_92a7007d5ad753dac67992b8c32" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."awards_category_enum" AS ENUM('Sinh Học', 'Hoá Học', 'Tiếng Trung', 'Tiếng Anh', 'Tiếng Pháp', 'Địa Lý', 'Lịch Sử', 'Tin Học', 'Tiếng Nhật', 'Ngữ Văn', 'Toán', 'Vật Lý', 'Tiếng Nga')`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."awards_level_enum" AS ENUM('Khuyến Khích', 'Hạng Nhất', 'Hạng Nhì', 'Hạng Ba')`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."awards_name_enum" AS ENUM('Học sinh giỏi cấp Quốc Gia')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."awards" ("category" "uni_guide"."awards_category_enum", "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "level" "uni_guide"."awards_level_enum", "name" "uni_guide"."awards_name_enum", "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "PK_bc3f6adc548ff46c76c03e06377" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_updated_at" ON "uni_guide"."awards" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_created_at" ON "uni_guide"."awards" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_level" ON "uni_guide"."awards" ("level") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_category" ON "uni_guide"."awards" ("category") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_student_id" ON "uni_guide"."awards" ("student_id") `,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."major_groups_name_enum" AS ENUM('Nông, lâm nghiệp và thủy sản', 'Kiến trúc và xây dựng', 'Nghệ thuật', 'Kinh doanh và quản lý', 'Máy tính và công nghệ thông tin', 'Khoa học giáo dục và đào tạo giáo viên', 'Kỹ thuật', 'Công nghệ kỹ thuật', 'Môi trường và bảo vệ môi trường', 'Sức khỏe', 'Nhân văn', 'Báo chí và thông tin', 'Pháp luật', 'Khoa học sự sống', 'Sản xuất và chế biến', 'Toán và thống kê', 'Khoa học tự nhiên', 'Khác', 'An ninh, Quốc phòng', 'Khoa học xã hội và hành vi', 'Dịch vụ xã hội', 'Du lịch, khách sạn, thể thao và dịch vụ cá nhân', 'Dịch vụ vận tải', 'Thú y')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."major_groups" ("code" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "english_name" character varying(255) NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" "uni_guide"."major_groups_name_enum" NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_aed9ebe4ce2616b293ff84997a3" UNIQUE ("code"), CONSTRAINT "PK_81b0cba483bec614241a6d20369" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_updated_at" ON "uni_guide"."major_groups" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_name" ON "uni_guide"."major_groups" ("name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_id" ON "uni_guide"."major_groups" ("id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_english_name" ON "uni_guide"."major_groups" ("english_name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_created_at" ON "uni_guide"."major_groups" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_code" ON "uni_guide"."major_groups" ("code") `,
        );
        await queryRunner.query(
            `CREATE TYPE "security"."users_role_enum" AS ENUM('admin', 'anonymous', 'moderator', 'user')`,
        );
        await queryRunner.query(
            `CREATE TABLE "security"."users" ("account_non_expired" boolean NOT NULL DEFAULT true, "account_non_locked" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255) DEFAULT 'anonymous', "credentials_non_expired" boolean NOT NULL DEFAULT true, "email" character varying(255) NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255), "password" character varying(128) NOT NULL, "permissions" jsonb, "phone_numbers" jsonb, "role" "security"."users_role_enum" NOT NULL DEFAULT 'user', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_phone_numbers" ON "security"."users" ("phone_numbers") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_permissions" ON "security"."users" ("permissions") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_updated_at" ON "security"."users" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_created_at" ON "security"."users" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_account_status" ON "security"."users" ("enabled", "credentials_non_expired", "account_non_expired", "account_non_locked") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_role" ON "security"."users" ("role") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_email" ON "security"."users" ("email") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_id_name" ON "security"."users" ("id", "name") `,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."academic_performances_academic_performance_enum" AS ENUM('Tốt', 'Chưa Đạt', 'Đạt', 'Khá')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."academic_performances" ("academic_performance" "uni_guide"."academic_performances_academic_performance_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "grade" integer NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "PK_d5290e0c0a20d532ee858ec55de" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."vsat_exams" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "score" numeric NOT NULL, "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "PK_8a2763d55ec38f06c9113b8b5c4" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."talent_exams" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "score" numeric NOT NULL, "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "PK_57d0d8dbbad5c04018d7386296c" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."national_exams" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "score" numeric NOT NULL, "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "PK_7d8f391a646ca191eb583e8762b" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."certifications_cefr_enum" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2')`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."certifications_exam_type_enum" AS ENUM('Alevel', 'ACT', 'DoulingoEnglishTest', 'HSA', 'IB', 'IELTS', 'JLPT', 'OSSD', 'PTEAcademic', 'SAT', 'TOEFL CBT', 'TOEFL iBT', 'TOEFL Paper', 'TOEIC', 'TSA', 'VNUHCM')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."certifications" ("cefr" "uni_guide"."certifications_cefr_enum", "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "exam_type" "uni_guide"."certifications_exam_type_enum", "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "level" character varying(50), "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "PK_fd763d412e4a1fb1b6dadd6e72b" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_updated_at" ON "uni_guide"."certifications" ("updated_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_created_at" ON "uni_guide"."certifications" ("created_at") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_level" ON "uni_guide"."certifications" ("level") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_cefr" ON "uni_guide"."certifications" ("cefr") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_student_id" ON "uni_guide"."certifications" ("student_id") `,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."aptitude_exams_exam_type_enum" AS ENUM('Alevel', 'ACT', 'DoulingoEnglishTest', 'HSA', 'IB', 'IELTS', 'JLPT', 'OSSD', 'PTEAcademic', 'SAT', 'TOEFL CBT', 'TOEFL iBT', 'TOEFL Paper', 'TOEIC', 'TSA', 'VNUHCM')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."aptitude_exams" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "exam_type" "uni_guide"."aptitude_exams_exam_type_enum" NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" numeric NOT NULL, "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "PK_3015f354bf257fa25f066fd362c" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."student_admissions" ADD CONSTRAINT "FK_794414569ff641b86139a029912" FOREIGN KEY ("admission_id") REFERENCES "uni_guide"."admissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."student_admissions" ADD CONSTRAINT "FK_223f964a2fff3f7a45610f43ded" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."prediction_results" ADD CONSTRAINT "FK_d9fc83e5d611a8aaf7161e10d0b" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."ocr_results" ADD CONSTRAINT "FK_8ed776072e6522a1fbef9818330" FOREIGN KEY ("file_id") REFERENCES "uni_guide"."files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."ocr_results" ADD CONSTRAINT "FK_f15a8dceb9fb656e7eeb1fe4808" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."vnuhcm_score_components" ADD CONSTRAINT "FK_be171050332cabbc4b4ddb985e0" FOREIGN KEY ("aptitude_exam_id") REFERENCES "uni_guide"."aptitude_exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."student_major_groups" ADD CONSTRAINT "FK_80f55c50a4aee989a2ed83a681c" FOREIGN KEY ("major_group_id") REFERENCES "uni_guide"."major_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."student_major_groups" ADD CONSTRAINT "FK_b4b7e67064e4ac35b50bd19a59e" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."students" ADD CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281" FOREIGN KEY ("user_id") REFERENCES "security"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."majors" ADD CONSTRAINT "FK_10c322c60cd25c2c170a3302033" FOREIGN KEY ("group_id") REFERENCES "uni_guide"."major_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."files" ADD CONSTRAINT "FK_48835644dda7c2d24fee3654081" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."conducts" ADD CONSTRAINT "FK_47bc9143f2d32258a71078a83aa" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."awards" ADD CONSTRAINT "FK_dda79d41e0a8fe0335ee01f67a6" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."academic_performances" ADD CONSTRAINT "FK_2b3904256576d80568b0209e545" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."vsat_exams" ADD CONSTRAINT "FK_51d6b2e05e7f7cd4879a26e21b0" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."talent_exams" ADD CONSTRAINT "FK_f33a0f11ceafab728ce046b115a" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."national_exams" ADD CONSTRAINT "FK_8274cadd00af462260b130a40de" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."certifications" ADD CONSTRAINT "FK_a6e2e7c5253997c79b6c95877f8" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."aptitude_exams" ADD CONSTRAINT "FK_82ae288fe4339351102e4b54ae3" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }
}
