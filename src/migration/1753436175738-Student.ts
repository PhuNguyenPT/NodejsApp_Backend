import { MigrationInterface, QueryRunner } from "typeorm";

export class Student1753436175738 implements MigrationInterface {
    name = "Student1753436175738";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "certifications" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying(255), "credentialId" character varying(100), "expirationDate" date, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "issueDate" date NOT NULL, "issuingOrganization" character varying(200) NOT NULL, "level" integer, "levelDescription" character varying(100), "modifiedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modifiedBy" character varying(255), "name" character varying(200) NOT NULL, "studentId" uuid NOT NULL, CONSTRAINT "PK_fd763d412e4a1fb1b6dadd6e72b" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_issuing_org" ON "certifications" ("issuingOrganization") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_expiration_date" ON "certifications" ("expirationDate") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_issue_date" ON "certifications" ("issueDate") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_certification_student_id" ON "certifications" ("studentId") `,
        );
        await queryRunner.query(
            `CREATE TABLE "students" ("createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying(255), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "location" character varying(500) NOT NULL, "major" character varying(200) NOT NULL, "maxBudget" numeric(12,2) NOT NULL, "minBudget" numeric(12,2) NOT NULL, "modifiedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modifiedBy" character varying(255), "userId" uuid NOT NULL, CONSTRAINT "UQ_e0208b4f964e609959aff431bf9" UNIQUE ("userId"), CONSTRAINT "REL_e0208b4f964e609959aff431bf" UNIQUE ("userId"), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_location" ON "students" ("location") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_major" ON "students" ("major") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_student_user_id" ON "students" ("userId") `,
        );
        await queryRunner.query(
            `CREATE TABLE "awards" ("awardDate" date NOT NULL, "awardId" character varying(100), "awardingOrganization" character varying(200), "category" character varying(100) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" character varying(255), "description" text, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "level" character varying(50) NOT NULL, "modifiedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modifiedBy" character varying(255), "name" character varying(200) NOT NULL, "studentId" uuid NOT NULL, CONSTRAINT "PK_bc3f6adc548ff46c76c03e06377" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_category" ON "awards" ("category") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_date" ON "awards" ("awardDate") `,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_award_student_id" ON "awards" ("studentId") `,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" ADD CONSTRAINT "FK_94ecc704512cfe5019d2577a994" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" ADD CONSTRAINT "FK_e0208b4f964e609959aff431bf9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "awards" ADD CONSTRAINT "FK_df483bf7bb17b72ea43be46d1ae" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "awards" DROP CONSTRAINT "FK_df483bf7bb17b72ea43be46d1ae"`,
        );
        await queryRunner.query(
            `ALTER TABLE "students" DROP CONSTRAINT "FK_e0208b4f964e609959aff431bf9"`,
        );
        await queryRunner.query(
            `ALTER TABLE "certifications" DROP CONSTRAINT "FK_94ecc704512cfe5019d2577a994"`,
        );
        await queryRunner.query(`DROP INDEX "public"."idx_award_student_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_award_date"`);
        await queryRunner.query(`DROP INDEX "public"."idx_award_category"`);
        await queryRunner.query(`DROP TABLE "awards"`);
        await queryRunner.query(`DROP INDEX "public"."idx_student_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_student_major"`);
        await queryRunner.query(`DROP INDEX "public"."idx_student_location"`);
        await queryRunner.query(`DROP TABLE "students"`);
        await queryRunner.query(
            `DROP INDEX "public"."idx_certification_student_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_certification_issue_date"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_certification_expiration_date"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."idx_certification_issuing_org"`,
        );
        await queryRunner.query(`DROP TABLE "certifications"`);
    }
}
