import { MigrationInterface, QueryRunner } from "typeorm";

export class OcrResult1755431897497 implements MigrationInterface {
    name = "OcrResult1755431897497";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."ocr_results_status_enum" AS ENUM('completed', 'failed', 'partial', 'pending', 'processing')`,
        );
        await queryRunner.query(
            `CREATE TABLE "ocr_results" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "errorMessage" text, "fileId" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "metadata" jsonb, "processedBy" character varying(255), "documentAnnotation" text, "scores" jsonb, "status" "public"."ocr_results_status_enum" NOT NULL DEFAULT 'pending', "studentId" uuid NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_562c4e52268d72e5b1a6833beb5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_ocr_student_file" ON "ocr_results" ("studentId", "fileId") `,
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
            `ALTER TABLE "ocr_results" ADD CONSTRAINT "FK_0787a97b8492c2aebe1dc2cc644" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "ocr_results" ADD CONSTRAINT "FK_4067652cc759950247f03b4a002" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "ocr_results" DROP CONSTRAINT "FK_4067652cc759950247f03b4a002"`,
        );
        await queryRunner.query(
            `ALTER TABLE "ocr_results" DROP CONSTRAINT "FK_0787a97b8492c2aebe1dc2cc644"`,
        );
        await queryRunner.query(`DROP INDEX "public"."idx_ocr_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ocr_file_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ocr_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ocr_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ocr_student_file"`);
        await queryRunner.query(`DROP TABLE "ocr_results"`);
        await queryRunner.query(`DROP TYPE "public"."ocr_results_status_enum"`);
    }
}
