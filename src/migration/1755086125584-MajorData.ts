import { MajorEntity } from "@/entity/major.entity.js";
import { MajorGroupEntity } from "@/entity/major.group.entity.js";
import {
    getEnglishKeyByVietnameseName,
    MajorGroup,
} from "@/type/enum/major.js";
import { MigrationInterface, QueryRunner } from "typeorm";

// Raw data extracted from the PDF
const majorData = [
    {
        code: "714",
        name: "Khoa học giáo dục và đào tạo giáo viên",
        majors: [
            { code: "71401", name: "Khoa học giáo dục" },
            { code: "71402", name: "Đào tạo giáo viên" },
            { code: "71490", name: "Khác" },
        ],
    },
    {
        code: "721",
        name: "Nghệ thuật",
        majors: [
            { code: "72101", name: "Mỹ thuật" },
            { code: "72102", name: "Nghệ thuật trình diễn" },
            { code: "72103", name: "Nghệ thuật nghe nhìn" },
            { code: "72104", name: "Mỹ thuật ứng dụng" },
            { code: "72190", name: "Khác" },
        ],
    },
    {
        code: "722",
        name: "Nhân văn",
        majors: [
            { code: "72201", name: "Ngôn ngữ, văn học và văn hóa Việt Nam" },
            { code: "72202", name: "Ngôn ngữ, văn học và văn hóa nước ngoài" },
            { code: "72290", name: "Khác" },
        ],
    },
    {
        code: "731",
        name: "Khoa học xã hội và hành vi",
        majors: [
            { code: "73101", name: "Kinh tế học" },
            { code: "73102", name: "Khoa học chính trị" },
            { code: "73103", name: "Xã hội học và Nhân học" },
            { code: "73104", name: "Tâm lý học" },
            { code: "73105", name: "Địa lý học" },
            { code: "73106", name: "Khu vực học" },
            { code: "73190", name: "Khác" },
        ],
    },
    {
        code: "732",
        name: "Báo chí và thông tin",
        majors: [
            { code: "73201", name: "Báo chí và truyền thông" },
            { code: "73202", name: "Thông tin - Thư viện" },
            { code: "73203", name: "Văn thư - Lưu trữ - Bảo tàng" },
            { code: "73204", name: "Xuất bản - Phát hành" },
            { code: "73290", name: "Khác" },
        ],
    },
    {
        code: "734",
        name: "Kinh doanh và quản lý",
        majors: [
            { code: "73401", name: "Kinh doanh" },
            { code: "73402", name: "Tài chính - Ngân hàng - Bảo hiểm" },
            { code: "73403", name: "Kế toán - Kiểm toán" },
            { code: "73404", name: "Quản trị - Quản lý" },
            { code: "73490", name: "Khác" },
        ],
    },
    {
        code: "738",
        name: "Pháp luật",
        majors: [
            { code: "73801", name: "Luật" },
            { code: "73890", name: "Khác" },
        ],
    },
    {
        code: "742",
        name: "Khoa học sự sống",
        majors: [
            { code: "74201", name: "Sinh học" },
            { code: "74202", name: "Sinh học ứng dụng" },
            { code: "74290", name: "Khác" },
        ],
    },
    {
        code: "744",
        name: "Khoa học tự nhiên",
        majors: [
            { code: "74401", name: "Khoa học vật chất" },
            { code: "74402", name: "Khoa học trái đất" },
            { code: "74403", name: "Khoa học môi trường" },
            { code: "74490", name: "Khác" },
        ],
    },
    {
        code: "746",
        name: "Toán và thống kê",
        majors: [
            { code: "74601", name: "Toán học" },
            { code: "74602", name: "Thống kê" },
            { code: "74690", name: "Khác" },
        ],
    },
    {
        code: "748",
        name: "Máy tính và công nghệ thông tin",
        majors: [
            { code: "74801", name: "Khoa học máy tính" },
            { code: "74802", name: "Mạng máy tính và truyền thông dữ liệu" },
            { code: "74803", name: "Kỹ thuật phần mềm" },
            { code: "74804", name: "Hệ thống thông tin" },
            { code: "74805", name: "Kỹ thuật máy tính" },
            { code: "74890", name: "Khác" },
        ],
    },
    {
        code: "751",
        name: "Công nghệ kỹ thuật",
        majors: [
            {
                code: "75101",
                name: "Công nghệ kỹ thuật điện, điện tử và viễn thông",
            },
            { code: "75102", name: "Công nghệ kỹ thuật cơ khí" },
            {
                code: "75103",
                name: "Công nghệ kỹ thuật hóa học, vật liệu, luyện kim và môi trường",
            },
            { code: "75106", name: "Quản lý công nghiệp" },
            { code: "75107", name: "Công nghệ dầu khí và khai thác" },
            { code: "75108", name: "Công nghệ kỹ thuật in" },
            { code: "75190", name: "Khác" },
        ],
    },
    {
        code: "752",
        name: "Kỹ thuật",
        majors: [
            { code: "75201", name: "Kỹ thuật cơ khí và cơ kỹ thuật" },
            { code: "75202", name: "Kỹ thuật điện, điện tử và viễn thông" },
            {
                code: "75203",
                name: "Kỹ thuật hóa học, vật liệu, luyện kim và môi trường",
            },
            { code: "75204", name: "Vật lý kỹ thuật" },
            {
                code: "75205",
                name: "Kỹ thuật địa chất, địa vật lý và trắc địa",
            },
            { code: "75206", name: "Kỹ thuật mỏ" },
            { code: "75290", name: "Khác" },
        ],
    },
    {
        code: "754",
        name: "Sản xuất và chế biến",
        majors: [
            {
                code: "75401",
                name: "Chế biến lương thực, thực phẩm và đồ uống",
            },
            { code: "75402", name: "Sản xuất, chế biến sợi, vải, giày, da" },
            { code: "75490", name: "Khác" },
        ],
    },
    {
        code: "758",
        name: "Kiến trúc và xây dựng",
        majors: [
            { code: "75801", name: "Kiến trúc và quy hoạch" },
            { code: "75802", name: "Xây dựng" },
            { code: "75803", name: "Quản lý xây dựng" },
            { code: "75890", name: "Khác" },
        ],
    },
    {
        code: "762",
        name: "Nông, lâm nghiệp và thủy sản",
        majors: [
            { code: "76201", name: "Nông nghiệp" },
            { code: "76202", name: "Lâm nghiệp" },
            { code: "76203", name: "Thủy sản" },
            { code: "76290", name: "Khác" },
        ],
    },
    {
        code: "764",
        name: "Thú y",
        majors: [
            { code: "76401", name: "Thú y" },
            { code: "76490", name: "Khác" },
        ],
    },
    {
        code: "772",
        name: "Sức khỏe",
        majors: [
            { code: "77201", name: "Y học" },
            { code: "77202", name: "Dược học" },
            { code: "77203", name: "Điều dưỡng - hộ sinh" },
            { code: "77204", name: "Dinh dưỡng" },
            { code: "77205", name: "Răng - Hàm - Mặt" },
            { code: "77206", name: "Y học cổ truyền" },
            { code: "77207", name: "Y tế công cộng" },
            { code: "77290", name: "Khác" },
        ],
    },
    {
        code: "776",
        name: "Dịch vụ xã hội",
        majors: [
            { code: "77601", name: "Công tác xã hội" },
            { code: "77690", name: "Khác" },
        ],
    },
    {
        code: "781",
        name: "Du lịch, khách sạn, thể thao và dịch vụ cá nhân",
        majors: [
            { code: "78101", name: "Du lịch" },
            { code: "78102", name: "Khách sạn, nhà hàng" },
            { code: "78103", name: "Thể dục, thể thao" },
            { code: "78104", name: "Dịch vụ cá nhân" },
            { code: "78190", name: "Khác" },
        ],
    },
    {
        code: "784",
        name: "Dịch vụ vận tải",
        majors: [
            { code: "78401", name: "Khai thác vận tải" },
            { code: "78490", name: "Khác" },
        ],
    },
    {
        code: "785",
        name: "Môi trường và bảo vệ môi trường",
        majors: [
            { code: "78501", name: "Khoa học môi trường" },
            { code: "78502", name: "Bảo vệ môi trường" },
            { code: "78590", name: "Khác" },
        ],
    },
    {
        code: "786",
        name: "An ninh, Quốc phòng",
        majors: [
            { code: "78601", name: "An ninh và trật tự xã hội" },
            { code: "78602", name: "Quân sự" },
            { code: "78690", name: "Khác" },
        ],
    },
    { code: "790", name: "Khác", majors: [{ code: "79090", name: "Khác" }] },
];

export class MajorData1755086125584 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Seed Major Groups
        const majorGroupsToInsert = majorData.map((groupData) => {
            const englishName = getEnglishKeyByVietnameseName(groupData.name);

            // Validate that the name is actually a valid enum value
            if (
                !Object.values(MajorGroup).includes(
                    groupData.name as MajorGroup,
                )
            ) {
                throw new Error(`Invalid major group name: ${groupData.name}`);
            }

            return new MajorGroupEntity({
                code: groupData.code,
                name: groupData.name as MajorGroup,
                englishName: englishName,
            });
        });

        await queryRunner.manager.save(MajorGroupEntity, majorGroupsToInsert);

        // 2. Fetch the newly created groups to get their UUIDs
        const allGroups = await queryRunner.manager.find(MajorGroupEntity);
        const groupMap = new Map<string, string>(); // Map of code -> uuid
        allGroups.forEach((g) => groupMap.set(g.code, g.id));

        // 3. Prepare and Seed Majors
        const majorsToInsert: MajorEntity[] = [];
        majorData.forEach((groupData) => {
            const groupId = groupMap.get(groupData.code);
            if (groupId) {
                groupData.majors.forEach((major) => {
                    majorsToInsert.push(
                        new MajorEntity({
                            code: major.code,
                            name: major.name,
                            group_id: groupId,
                        }),
                    );
                });
            }
        });
        await queryRunner.manager.save(MajorEntity, majorsToInsert);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // The order is important due to foreign key constraints
        await queryRunner.query(`DELETE FROM "majors"`);
        await queryRunner.query(`DELETE FROM "major_groups"`);
    }
}
