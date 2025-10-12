import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1754794905473 implements MigrationInterface {
    name = "InitialSchema1754794905473";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "student_major_groups" DROP CONSTRAINT "FK_80f55c50a4aee989a2ed83a681c"`,
        );
        await queryRunner.query(
            `ALTER TABLE "student_major_groups" DROP CONSTRAINT "FK_b4b7e67064e4ac35b50bd19a59e"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" DROP CONSTRAINT "FK_e0208b4f964e609959aff431bf9"`,
        );
        await queryRunner.query(
            `ALTER TABLE "awards" DROP CONSTRAINT "FK_df483bf7bb17b72ea43be46d1ae"`,
        );
        await queryRunner.query(
            `ALTER TABLE "files" DROP CONSTRAINT "FK_7e7425b17f9e707331e9a6c7335"`,
        );
        await queryRunner.query(
            `ALTER TABLE "files" DROP CONSTRAINT "FK_f2cc0c836c7f1f89e552b8c4212"`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" DROP CONSTRAINT "FK_94ecc704512cfe5019d2577a994"`,
        );
        await queryRunner.query(
            `ALTER TABLE "prediction_results" DROP CONSTRAINT "FK_7c8315e2178499a49cf2439e47b"`,
        );
        await queryRunner.query(
            `ALTER TABLE "ocr_results" DROP CONSTRAINT "FK_4067652cc759950247f03b4a002"`,
        );
        await queryRunner.query(
            `ALTER TABLE "ocr_results" DROP CONSTRAINT "FK_0787a97b8492c2aebe1dc2cc644"`,
        );
        await queryRunner.query(
            `ALTER TABLE "majors" DROP CONSTRAINT "FK_10c322c60cd25c2c170a3302033"`,
        );
        await queryRunner.query(
            `ALTER TABLE "student_admissions" DROP CONSTRAINT "FK_223f964a2fff3f7a45610f43ded"`,
        );
        await queryRunner.query(
            `ALTER TABLE "student_admissions" DROP CONSTRAINT "FK_794414569ff641b86139a029912"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_80f55c50a4aee989a2ed83a681"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_b4b7e67064e4ac35b50bd19a59"`,
        );
        await queryRunner.query(`DROP TABLE "student_major_groups"`);
        await queryRunner.query(`DROP INDEX "public"."idx_students_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_students_province"`);
        await queryRunner.query(`DROP INDEX "public"."idx_students_budget"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_students_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_students_created_by"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_students_updated_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_students_updated_by"`,
        );
        await queryRunner.query(`DROP TABLE "students"`);
        await queryRunner.query(`DROP TYPE "public"."students_unitype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_award_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_award_category"`);
        await queryRunner.query(`DROP INDEX "public"."idx_award_level"`);
        await queryRunner.query(`DROP INDEX "public"."idx_award_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_award_updated_at"`);
        await queryRunner.query(`DROP TABLE "awards"`);
        await queryRunner.query(`DROP TYPE "public"."awards_name_enum"`);
        await queryRunner.query(`DROP TYPE "public"."awards_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."awards_category_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_major_groups_code"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_major_groups_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_major_groups_english_name"`,
        );
        await queryRunner.query(`DROP INDEX "public"."idx_major_groups_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_major_groups_name"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_major_groups_updated_at"`,
        );
        await queryRunner.query(`DROP TABLE "major_groups"`);
        await queryRunner.query(`DROP TYPE "public"."major_groups_name_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_file_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_file_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_file_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_file_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_file_updated_at"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP TYPE "public"."files_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."files_filetype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_admissions_code"`);
        await queryRunner.query(`DROP INDEX "public"."idx_admissions_type"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_major_code"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_major_name"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_province"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_study_program"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_uni_code"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_uni_name"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_uni_type"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_tuition_fee"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_uni_major"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_province_uni_type"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_admission_type_major"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_study_program_admission_type"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_province_tuition_fee"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_uni_type_tuition_fee"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_admissions_updated_at"`,
        );
        await queryRunner.query(`DROP TABLE "admissions"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_certification_student_id"`,
        );
        await queryRunner.query(`DROP INDEX "public"."idx_certification_cefr"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_certification_level"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_certification_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_certification_updated_at"`,
        );
        await queryRunner.query(`DROP TABLE "certifications"`);
        await queryRunner.query(
            `DROP TYPE "public"."certifications_cefr_enum"`,
        );
        await queryRunner.query(`DROP INDEX "public"."idx_user_id_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_role"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_user_account_status"`,
        );
        await queryRunner.query(`DROP INDEX "public"."idx_user_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_updated_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_permissions"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_phone_numbers"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_prediction_results_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_prediction_results_created_by"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_prediction_results_status"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_prediction_results_student_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_prediction_results_updated_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_prediction_results_updated_by"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_prediction_results_user_id"`,
        );
        await queryRunner.query(`DROP TABLE "prediction_results"`);
        await queryRunner.query(
            `DROP TYPE "public"."prediction_results_status_enum"`,
        );
        await queryRunner.query(`DROP INDEX "public"."idx_ocr_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ocr_file_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ocr_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ocr_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ocr_updated_at"`);
        await queryRunner.query(`DROP TABLE "ocr_results"`);
        await queryRunner.query(`DROP TYPE "public"."ocr_results_status_enum"`);
        await queryRunner.query(`DROP TABLE "majors"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_student_admissions_student_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_student_admissions_admission_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_student_admissions_composite"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_student_admissions_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_student_admissions_updated_at"`,
        );
        await queryRunner.query(`DROP TABLE "student_admissions"`);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "student_admissions" ("admission_id" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "student_id" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_28566988c92be41022acf22bdf3" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_updated_at" ON "student_admissions" ("updatedAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_created_at" ON "student_admissions" ("createdAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_composite" ON "student_admissions" ("student_id", "admission_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_admission_id" ON "student_admissions" ("admission_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_admissions_student_id" ON "student_admissions" ("student_id") `,
        );
        await queryRunner.query(
            `CREATE TABLE "majors" ("code" character varying(255) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "group_id" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b287db61b00b45e58c854f19da" UNIQUE ("code"), CONSTRAINT "PK_9d82cf80fe0593040e50ccb297e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."ocr_results_status_enum" AS ENUM('completed', 'failed', 'processing')`,
        );
        await queryRunner.query(
            `CREATE TABLE "ocr_results" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying(255), "documentAnnotation" text, "errorMessage" text, "fileId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "metadata" jsonb, "scores" jsonb, "status" "public"."ocr_results_status_enum" NOT NULL, "studentId" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" character varying(255), CONSTRAINT "UQ_ocr_student_file" UNIQUE ("studentId", "fileId"), CONSTRAINT "REL_0787a97b8492c2aebe1dc2cc64" UNIQUE ("fileId"), CONSTRAINT "PK_562c4e52268d72e5b1a6833beb5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_updated_at" ON "ocr_results" ("updatedAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_created_at" ON "ocr_results" ("createdAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_status" ON "ocr_results" ("status") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_file_id" ON "ocr_results" ("fileId") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_student_id" ON "ocr_results" ("studentId") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."prediction_results_status_enum" AS ENUM('completed', 'failed', 'partial', 'processing')`,
        );
        await queryRunner.query(
            `CREATE TABLE "prediction_results" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "l1PredictResults" jsonb, "l2PredictResults" jsonb, "status" "public"."prediction_results_status_enum" NOT NULL, "studentId" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" character varying, "userId" uuid, CONSTRAINT "REL_7c8315e2178499a49cf2439e47" UNIQUE ("studentId"), CONSTRAINT "PK_44ca49774e1883302d08cb1e0fa" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_user_id" ON "prediction_results" ("userId") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_updated_by" ON "prediction_results" ("updatedBy") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_updated_at" ON "prediction_results" ("updatedAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_student_id" ON "prediction_results" ("studentId") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_status" ON "prediction_results" ("status") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_created_by" ON "prediction_results" ("createdBy") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_prediction_results_created_at" ON "prediction_results" ("createdAt") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'anonymous', 'moderator', 'user')`,
        );
        await queryRunner.query(
            `CREATE TABLE "users" ("accountNonExpired" boolean NOT NULL DEFAULT true, "accountNonLocked" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying(255) DEFAULT 'anonymous', "credentialsNonExpired" boolean NOT NULL DEFAULT true, "email" character varying(255) NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255), "password" character varying(128) NOT NULL, "permissions" jsonb, "phoneNumbers" jsonb, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" character varying(255), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_phone_numbers" ON "users" ("phoneNumbers") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_permissions" ON "users" ("permissions") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_updated_at" ON "users" ("updatedAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_created_at" ON "users" ("createdAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_account_status" ON "users" ("enabled", "credentialsNonExpired", "accountNonExpired", "accountNonLocked") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_role" ON "users" ("role") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_email" ON "users" ("email") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_user_id_name" ON "users" ("id", "name") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."certifications_cefr_enum" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2')`,
        );
        await queryRunner.query(
            `CREATE TABLE "certifications" ("cefr" "public"."certifications_cefr_enum", "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying(255), "examType" jsonb, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "level" character varying(50), "studentId" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" character varying(255), CONSTRAINT "PK_fd763d412e4a1fb1b6dadd6e72b" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_updated_at" ON "certifications" ("updatedAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_created_at" ON "certifications" ("createdAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_level" ON "certifications" ("level") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_cefr" ON "certifications" ("cefr") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_student_id" ON "certifications" ("studentId") `,
        );
        await queryRunner.query(
            `CREATE TABLE "admissions" ("admission_code" character varying NOT NULL, "admission_type" character varying NOT NULL, "admission_type_name" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "major_code" integer NOT NULL, "major_name" character varying NOT NULL, "province" character varying NOT NULL, "study_program" character varying NOT NULL, "subject_combination" character varying NOT NULL, "tuition_fee" bigint NOT NULL, "uni_code" character varying NOT NULL, "uni_name" character varying NOT NULL, "uni_type" character varying NOT NULL, "uni_web_link" character varying NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6d47682a899dfa0a78ce11fe98a" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_updated_at" ON "admissions" ("updatedAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_created_at" ON "admissions" ("createdAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_uni_type_tuition_fee" ON "admissions" ("uni_type", "tuition_fee") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_province_tuition_fee" ON "admissions" ("province", "tuition_fee") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_study_program_admission_type" ON "admissions" ("study_program", "admission_type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_admission_type_major" ON "admissions" ("admission_type", "major_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_province_uni_type" ON "admissions" ("province", "uni_type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_uni_major" ON "admissions" ("uni_code", "major_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_tuition_fee" ON "admissions" ("tuition_fee") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_uni_type" ON "admissions" ("uni_type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_uni_name" ON "admissions" ("uni_name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_uni_code" ON "admissions" ("uni_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_study_program" ON "admissions" ("study_program") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_province" ON "admissions" ("province") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_major_name" ON "admissions" ("major_name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_major_code" ON "admissions" ("major_code") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_type" ON "admissions" ("admission_type") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_admissions_code" ON "admissions" ("admission_code") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."files_filetype_enum" AS ENUM('certificate', 'document', 'image', 'other', 'portfolio', 'resume', 'transcript')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."files_status_enum" AS ENUM('active', 'archived', 'deleted')`,
        );
        await queryRunner.query(
            `CREATE TABLE "files" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying(255), "description" character varying(500), "fileContent" bytea NOT NULL, "fileName" character varying(255) NOT NULL, "filePath" character varying(500), "fileSize" bigint NOT NULL, "fileType" "public"."files_filetype_enum" NOT NULL DEFAULT 'other', "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "metadata" jsonb, "mimeType" character varying(100) NOT NULL, "originalFileName" character varying(255) NOT NULL, "status" "public"."files_status_enum" NOT NULL DEFAULT 'active', "studentId" uuid NOT NULL, "tags" character varying(255), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" character varying(255), "userId" uuid, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_file_updated_at" ON "files" ("updatedAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_file_created_at" ON "files" ("createdAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_file_status" ON "files" ("status") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_file_type" ON "files" ("fileType") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_file_student_id" ON "files" ("studentId") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."major_groups_name_enum" AS ENUM('Nông, lâm nghiệp và thủy sản', 'Kiến trúc và xây dựng', 'Nghệ thuật', 'Kinh doanh và quản lý', 'Máy tính và công nghệ thông tin', 'Khoa học giáo dục và đào tạo giáo viên', 'Kỹ thuật', 'Công nghệ kỹ thuật', 'Môi trường và bảo vệ môi trường', 'Sức khỏe', 'Nhân văn', 'Báo chí và thông tin', 'Pháp luật', 'Khoa học sự sống', 'Sản xuất và chế biến', 'Toán và thống kê', 'Khoa học tự nhiên', 'Khác', 'An ninh, Quốc phòng', 'Khoa học xã hội và hành vi', 'Dịch vụ xã hội', 'Du lịch, khách sạn, thể thao và dịch vụ cá nhân', 'Dịch vụ vận tải', 'Thú y')`,
        );
        await queryRunner.query(
            `CREATE TABLE "major_groups" ("code" character varying(255) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "english_name" character varying(255) NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" "public"."major_groups_name_enum" NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_aed9ebe4ce2616b293ff84997a3" UNIQUE ("code"), CONSTRAINT "PK_81b0cba483bec614241a6d20369" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_updated_at" ON "major_groups" ("updatedAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_name" ON "major_groups" ("name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_id" ON "major_groups" ("id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_english_name" ON "major_groups" ("english_name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_created_at" ON "major_groups" ("createdAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_major_groups_code" ON "major_groups" ("code") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."awards_category_enum" AS ENUM('Sinh Học', 'Hoá Học', 'Tiếng Trung', 'Tiếng Anh', 'Tiếng Pháp', 'Địa Lý', 'Lịch Sử', 'Tin Học', 'Tiếng Nhật', 'Ngữ Văn', 'Toán', 'Vật Lý', 'Tiếng Nga')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."awards_level_enum" AS ENUM('Hạng Nhất', 'Hạng Nhì', 'Hạng Ba')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."awards_name_enum" AS ENUM('Học sinh giỏi cấp Quốc Gia')`,
        );
        await queryRunner.query(
            `CREATE TABLE "awards" ("category" "public"."awards_category_enum", "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "level" "public"."awards_level_enum", "name" "public"."awards_name_enum", "studentId" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" character varying(255), CONSTRAINT "PK_bc3f6adc548ff46c76c03e06377" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_updated_at" ON "awards" ("updatedAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_created_at" ON "awards" ("createdAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_level" ON "awards" ("level") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_category" ON "awards" ("category") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_student_id" ON "awards" ("studentId") `,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."students_unitype_enum" AS ENUM('Tư thục', 'Công lập')`,
        );
        await queryRunner.query(
            `CREATE TABLE "students" ("academicPerformances" jsonb, "aptitudeTestScore" jsonb, "conducts" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "majors" jsonb, "maxBudget" numeric(14,2), "minBudget" numeric(14,2), "nationalExams" jsonb, "province" character varying, "specialStudentCases" jsonb, "talentScores" jsonb, "uniType" "public"."students_unitype_enum", "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" character varying(255), "userId" uuid, "vsatScores" jsonb, CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_updated_by" ON "students" ("updatedBy") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_updated_at" ON "students" ("updatedAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_created_by" ON "students" ("createdBy") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_created_at" ON "students" ("createdAt") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_budget" ON "students" ("minBudget", "maxBudget") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_province" ON "students" ("province") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_students_user_id" ON "students" ("userId") `,
        );
        await queryRunner.query(
            `CREATE TABLE "student_major_groups" ("student_id" uuid NOT NULL, "major_group_id" uuid NOT NULL, CONSTRAINT "PK_f0ed0c22931c345a0da34dc8866" PRIMARY KEY ("student_id", "major_group_id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_b4b7e67064e4ac35b50bd19a59" ON "student_major_groups" ("student_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_80f55c50a4aee989a2ed83a681" ON "student_major_groups" ("major_group_id") `,
        );
        await queryRunner.query(
            `ALTER TABLE "student_admissions" ADD CONSTRAINT "FK_794414569ff641b86139a029912" FOREIGN KEY ("admission_id") REFERENCES "admissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "student_admissions" ADD CONSTRAINT "FK_223f964a2fff3f7a45610f43ded" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "majors" ADD CONSTRAINT "FK_10c322c60cd25c2c170a3302033" FOREIGN KEY ("group_id") REFERENCES "major_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "ocr_results" ADD CONSTRAINT "FK_0787a97b8492c2aebe1dc2cc644" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "ocr_results" ADD CONSTRAINT "FK_4067652cc759950247f03b4a002" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "prediction_results" ADD CONSTRAINT "FK_7c8315e2178499a49cf2439e47b" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" ADD CONSTRAINT "FK_94ecc704512cfe5019d2577a994" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "files" ADD CONSTRAINT "FK_f2cc0c836c7f1f89e552b8c4212" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "files" ADD CONSTRAINT "FK_7e7425b17f9e707331e9a6c7335" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "awards" ADD CONSTRAINT "FK_df483bf7bb17b72ea43be46d1ae" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD CONSTRAINT "FK_e0208b4f964e609959aff431bf9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "student_major_groups" ADD CONSTRAINT "FK_b4b7e67064e4ac35b50bd19a59e" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "student_major_groups" ADD CONSTRAINT "FK_80f55c50a4aee989a2ed83a681c" FOREIGN KEY ("major_group_id") REFERENCES "major_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }
}
