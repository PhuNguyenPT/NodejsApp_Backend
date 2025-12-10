import type { MigrationInterface, QueryRunner } from "typeorm";

export class Transcript1764903586789 implements MigrationInterface {
    name = "Transcript1764903586789";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."transcript_subjects" DROP CONSTRAINT "FK_1867ee41fd76c67bf0bbffc40d7"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."transcripts" DROP CONSTRAINT "FK_f43b4eda17d7cd48874ab2ecc60"`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."transcripts" DROP CONSTRAINT "FK_86ff89c447ff969df2f63b17907"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."transcript_subjects"`);
        await queryRunner.query(
            `DROP TYPE "uni_guide"."transcript_subjects_subject_enum"`,
        );
        await queryRunner.query(`DROP TABLE "uni_guide"."transcripts"`);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."transcripts" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "grade" integer, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ocr_result_id" uuid, "semester" integer, "student_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "REL_86ff89c447ff969df2f63b1790" UNIQUE ("ocr_result_id"), CONSTRAINT "PK_40c75f89c1fc953cd33e702247d" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "uni_guide"."transcript_subjects_subject_enum" AS ENUM('Công Nghệ', 'Địa Lý', 'GDKTPL', 'Hóa Học', 'Lịch Sử', 'Ngữ Văn', 'Sinh Học', 'Tiếng Anh', 'Tiếng Đức', 'Tiếng Hàn', 'Tiếng Nga', 'Tiếng Nhật', 'Tiếng Pháp', 'Tiếng Trung', 'Tin Học', 'Toán', 'Vật Lý')`,
        );
        await queryRunner.query(
            `CREATE TABLE "uni_guide"."transcript_subjects" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_by" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" numeric NOT NULL, "subject" "uni_guide"."transcript_subjects_subject_enum" NOT NULL, "transcript_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_by" character varying(255), CONSTRAINT "PK_fbd5415b8968b2e85aa3da61a6a" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."transcripts" ADD CONSTRAINT "FK_86ff89c447ff969df2f63b17907" FOREIGN KEY ("ocr_result_id") REFERENCES "uni_guide"."ocr_results"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."transcripts" ADD CONSTRAINT "FK_f43b4eda17d7cd48874ab2ecc60" FOREIGN KEY ("student_id") REFERENCES "uni_guide"."students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "uni_guide"."transcript_subjects" ADD CONSTRAINT "FK_1867ee41fd76c67bf0bbffc40d7" FOREIGN KEY ("transcript_id") REFERENCES "uni_guide"."transcripts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }
}
