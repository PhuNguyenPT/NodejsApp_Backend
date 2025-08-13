import { MigrationInterface, QueryRunner } from "typeorm";

export class Major1755086117747 implements MigrationInterface {
    name = "Major1755086117747";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."major_groups_english_name_enum" AS ENUM('Nông, lâm nghiệp và thủy sản', 'Kiến trúc và xây dựng', 'Nghệ thuật', 'Kinh doanh và quản lý', 'Máy tính và công nghệ thông tin', 'Khoa học giáo dục và đào tạo giáo viên', 'Kỹ thuật', 'Công nghệ kỹ thuật', 'Môi trường và bảo vệ môi trường', 'Sức khỏe', 'Nhân văn', 'Báo chí và thông tin', 'Pháp luật', 'Khoa học sự sống', 'Sản xuất và chế biến', 'Toán và thống kê', 'Khoa học tự nhiên', 'Khác', 'An ninh, Quốc phòng', 'Khoa học xã hội và hành vi', 'Dịch vụ xã hội', 'Du lịch, khách sạn, thể thao và dịch vụ cá nhân', 'Dịch vụ vận tải', 'Thú y')`,
        );
        await queryRunner.query(
            `CREATE TABLE "major_groups" ("code" character varying(255) NOT NULL, "english_name" "public"."major_groups_english_name_enum" NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, CONSTRAINT "UQ_aed9ebe4ce2616b293ff84997a3" UNIQUE ("code"), CONSTRAINT "PK_81b0cba483bec614241a6d20369" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "majors" ("code" character varying(255) NOT NULL, "group_id" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, CONSTRAINT "UQ_8b287db61b00b45e58c854f19da" UNIQUE ("code"), CONSTRAINT "PK_9d82cf80fe0593040e50ccb297e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "majors" ADD CONSTRAINT "FK_10c322c60cd25c2c170a3302033" FOREIGN KEY ("group_id") REFERENCES "major_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "majors" DROP CONSTRAINT "FK_10c322c60cd25c2c170a3302033"`,
        );
        await queryRunner.query(`DROP TABLE "majors"`);
        await queryRunner.query(`DROP TABLE "major_groups"`);
        await queryRunner.query(
            `DROP TYPE "public"."major_groups_english_name_enum"`,
        );
    }
}
