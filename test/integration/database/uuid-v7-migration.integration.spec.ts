// test/integration/database/uuid-v7-migration.integration.spec.ts
import type { DataSource, QueryRunner } from "typeorm";

import { validate as uuidValidate, version as uuidVersion } from "uuid";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { UUID } from "@/type/common/uuid.type.js";

import { iocContainer } from "@/app/ioc-container.js";
import { getApp } from "@/test/setup.js";
import { TYPES } from "@/type/container/types.js";

interface CountResult {
    count: string;
}

interface ExtensionResult {
    extname: string;
    extversion: string;
}

interface FunctionExistsResult {
    exists: boolean;
}

interface PostgresVersionResult {
    version: string;
    version_num: number;
}

interface TableDefaultResult {
    column_default: string;
    column_name: string;
    table_name: string;
    table_schema: string;
}

describe("UUID v7 Migration Tests", () => {
    let dataSource: DataSource;
    let queryRunner: QueryRunner;
    let postgresVersion: number;
    let hasNativeUuidv7: boolean;
    let testUserId: string;

    beforeAll(async () => {
        getApp();
        dataSource = iocContainer.get<DataSource>(TYPES.DataSource);
        if (!dataSource.isInitialized) {
            throw new Error("DataSource is not initialized");
        }

        queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();

        // Check PostgreSQL version
        const versionResult = (await queryRunner.query(`
            SELECT 
                version() as version,
                current_setting('server_version_num')::int as version_num
        `)) as PostgresVersionResult[];

        const versionData = versionResult[0];

        postgresVersion = versionData.version_num;
        hasNativeUuidv7 = postgresVersion >= 180000; // PostgreSQL 18.0.0

        const extensions = (await queryRunner.query(`
            SELECT extname, extversion 
            FROM pg_extension 
            WHERE extname IN ('pgcrypto', 'uuid-ossp')
            ORDER BY extname
        `)) as ExtensionResult[];

        const hasPgcrypto = extensions.some(
            (ext) => ext.extname === "pgcrypto",
        );
        const hasPgUuidOssp = extensions.some(
            (ext) => ext.extname === "uuid-ossp",
        );

        if (!hasPgcrypto) {
            // Required for gen_random_uuid() (v4)
            await queryRunner.query(
                `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
            );
        }

        if (!hasPgUuidOssp) {
            // Required for older uuid-ossp functions
            await queryRunner.query(
                `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
            );
        }

        // If PostgreSQL < 18, verify custom uuidv7() function exists
        if (!hasNativeUuidv7) {
            const functionExists = (await queryRunner.query(`
                SELECT EXISTS(
                    SELECT 1 
                    FROM pg_proc p
                    JOIN pg_namespace n ON p.pronamespace = n.oid
                    WHERE p.proname = 'uuidv7'
                    AND n.nspname = 'public'
                ) as exists
            `)) as FunctionExistsResult[];

            const exists = functionExists[0]?.exists;
            if (!exists) {
                throw new Error(
                    "PostgreSQL version < 18 detected but custom uuidv7() function not found. " +
                        "Please create the custom uuidv7() function before running migrations.",
                );
            }
        }

        // Create a test user for foreign key constraints
        const userResult = (await queryRunner.query(`
            INSERT INTO "security"."users" 
            (email, password, role, name)
            VALUES 
            ('test-fk-user@example.com', 'test-password', 'user', 'Test FK User')
            RETURNING id
        `)) as { id: UUID }[];
        testUserId = userResult[0].id;
    });

    it("should verify PostgreSQL version and extensions", async () => {
        expect(postgresVersion).toBeGreaterThan(0);

        const extensions = (await queryRunner.query(`
            SELECT extname, extversion 
            FROM pg_extension 
            WHERE extname IN ('pgcrypto', 'uuid-ossp')
            ORDER BY extname
        `)) as ExtensionResult[];

        const hasPgcrypto = extensions.some(
            (ext) => ext.extname === "pgcrypto",
        );
        const hasPgUuidOssp = extensions.some(
            (ext) => ext.extname === "uuid-ossp",
        );
        expect(hasPgcrypto).toBe(true);
        expect(hasPgUuidOssp).toBe(true);
    });

    it("should verify uuidv7() function generates valid UUIDs", async () => {
        const result = (await queryRunner.query(`SELECT uuidv7() as id`)) as {
            id: UUID;
        }[];

        const uuidData = result[0];

        expect(uuidValidate(uuidData.id)).toBe(true);
        expect(uuidVersion(uuidData.id)).toBe(7);
    });

    it("should verify all tables use uuidv7() as default", async () => {
        const result = (await queryRunner.query(`
            SELECT 
                table_schema,
                table_name,
                column_name,
                column_default
            FROM information_schema.columns
            WHERE column_name = 'id'
            AND data_type = 'uuid'
            AND table_schema IN ('security', 'uni_guide', 'machine_learning')
            ORDER BY table_schema, table_name
        `)) as TableDefaultResult[];

        expect(result.length).toBeGreaterThan(0);

        const tablesWithWrongDefault = result.filter(
            (row) => !row.column_default.includes("uuidv7()"),
        );

        expect(tablesWithWrongDefault).toHaveLength(0);
    });

    it("should generate valid UUID v7 format when inserting records", async () => {
        const testEmail = "test-uuid-v7@example.com";

        try {
            const result = (await queryRunner.query(
                `
                INSERT INTO "security"."users" 
                (email, password, role, name)
                VALUES 
                ($1, 'test-password', 'user', 'UUID Test User')
                RETURNING id
            `,
                [testEmail],
            )) as { id: UUID }[];

            const insertedData = result[0];

            expect(uuidValidate(insertedData.id)).toBe(true);
            expect(uuidVersion(insertedData.id)).toBe(7);
        } finally {
            await queryRunner.query(
                `DELETE FROM "security"."users" WHERE email = $1`,
                [testEmail],
            );
        }
    });

    it("should generate valid UUID v7 in uni_guide schema tables", async () => {
        let studentId: string;
        let majorGroupId: string;

        try {
            // Test students table
            const studentResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."students" 
                (user_id, province, uni_type)
                VALUES 
                ($1, 'Ho Chi Minh', 'Công lập')
                RETURNING id
            `,
                [testUserId],
            )) as { id: UUID }[];

            studentId = studentResult[0].id;
            expect(uuidValidate(studentId)).toBe(true);
            expect(uuidVersion(studentId)).toBe(7);

            // Test major_groups table
            const majorGroupResult = (await queryRunner.query(`
                INSERT INTO "uni_guide"."major_groups" 
                (code, name, english_name)
                VALUES 
                ('TEST123', 'Khác', 'Other')
                RETURNING id
            `)) as { id: UUID }[];

            majorGroupId = majorGroupResult[0].id;
            expect(uuidValidate(majorGroupId)).toBe(true);
            expect(uuidVersion(majorGroupId)).toBe(7);

            // Test majors table
            const majorResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."majors" 
                (code, name, group_id)
                VALUES 
                ('TEST001', 'Test Major', $1)
                RETURNING id
            `,
                [majorGroupId],
            )) as { id: UUID }[];

            expect(uuidValidate(majorResult[0].id)).toBe(true);
            expect(uuidVersion(majorResult[0].id)).toBe(7);

            // Test student_major_groups table
            const smgResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."student_major_groups" 
                (student_id, major_group_id)
                VALUES 
                ($1, $2)
                RETURNING id
            `,
                [studentId, majorGroupId],
            )) as { id: UUID }[];

            expect(uuidValidate(smgResult[0].id)).toBe(true);
            expect(uuidVersion(smgResult[0].id)).toBe(7);

            // Test files table
            const fileResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."files" 
                (student_id, file_name, original_file_name, mime_type, file_size, file_content)
                VALUES 
                ($1, 'test.pdf', 'test.pdf', 'application/pdf', 1024, $2)
                RETURNING id
            `,
                [studentId, Buffer.from("test")],
            )) as { id: UUID }[];

            expect(uuidValidate(fileResult[0].id)).toBe(true);
            expect(uuidVersion(fileResult[0].id)).toBe(7);

            // Test prediction_results table
            const predResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."prediction_results" 
                (student_id, status)
                VALUES 
                ($1, 'processing')
                RETURNING id
            `,
                [studentId],
            )) as { id: UUID }[];

            expect(uuidValidate(predResult[0].id)).toBe(true);
            expect(uuidVersion(predResult[0].id)).toBe(7);

            // Test admissions table
            const admissionResult = (await queryRunner.query(`
                INSERT INTO "uni_guide"."admissions" 
                (admission_code, uni_code)
                VALUES 
                ('TEST-ADM-001', 'TEST-UNI')
                RETURNING id
            `)) as { id: UUID }[];

            expect(uuidValidate(admissionResult[0].id)).toBe(true);
            expect(uuidVersion(admissionResult[0].id)).toBe(7);

            // Test conducts table
            const conductResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."conducts" 
                (student_id, conduct, grade)
                VALUES 
                ($1, 'Tốt', 10)
                RETURNING id
            `,
                [studentId],
            )) as { id: UUID }[];

            expect(uuidValidate(conductResult[0].id)).toBe(true);
            expect(uuidVersion(conductResult[0].id)).toBe(7);

            // Test academic_performances table
            const apResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."academic_performances" 
                (student_id, academic_performance, grade)
                VALUES 
                ($1, 'Tốt', 10)
                RETURNING id
            `,
                [studentId],
            )) as { id: UUID }[];

            expect(uuidValidate(apResult[0].id)).toBe(true);
            expect(uuidVersion(apResult[0].id)).toBe(7);

            // Test aptitude_exams table
            const aptitudeResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."aptitude_exams" 
                (student_id, exam_type, score)
                VALUES 
                ($1, 'SAT', 1500)
                RETURNING id
            `,
                [studentId],
            )) as { id: UUID }[];

            expect(uuidValidate(aptitudeResult[0].id)).toBe(true);
            expect(uuidVersion(aptitudeResult[0].id)).toBe(7);

            // Test certifications table
            const certResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."certifications" 
                (student_id, exam_type, cefr)
                VALUES 
                ($1, 'IELTS', 'B2')
                RETURNING id
            `,
                [studentId],
            )) as { id: UUID }[];

            expect(uuidValidate(certResult[0].id)).toBe(true);
            expect(uuidVersion(certResult[0].id)).toBe(7);

            // Test national_exams table
            const nationalResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."national_exams" 
                (student_id, name, score)
                VALUES 
                ($1, 'Toán', 9.5)
                RETURNING id
            `,
                [studentId],
            )) as { id: UUID }[];

            expect(uuidValidate(nationalResult[0].id)).toBe(true);
            expect(uuidVersion(nationalResult[0].id)).toBe(7);

            // Test talent_exams table
            const talentResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."talent_exams" 
                (student_id, name, score)
                VALUES 
                ($1, 'Music', 8.5)
                RETURNING id
            `,
                [studentId],
            )) as { id: UUID }[];

            expect(uuidValidate(talentResult[0].id)).toBe(true);
            expect(uuidVersion(talentResult[0].id)).toBe(7);

            // Test vsat_exams table
            const vsatResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."vsat_exams" 
                (student_id, name, score)
                VALUES 
                ($1, 'VSAT Math', 700)
                RETURNING id
            `,
                [studentId],
            )) as { id: UUID }[];

            expect(uuidValidate(vsatResult[0].id)).toBe(true);
            expect(uuidVersion(vsatResult[0].id)).toBe(7);

            // Test awards table
            const awardResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."awards" 
                (student_id, name, category, level)
                VALUES 
                ($1, 'Học sinh giỏi cấp Quốc Gia', 'Toán', 'Hạng Nhất')
                RETURNING id
            `,
                [studentId],
            )) as { id: UUID }[];

            expect(uuidValidate(awardResult[0].id)).toBe(true);
            expect(uuidVersion(awardResult[0].id)).toBe(7);

            // Test transcripts table
            const transcriptResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."transcripts" 
                (student_id, grade, semester)
                VALUES 
                ($1, 10, 1)
                RETURNING id
            `,
                [studentId],
            )) as { id: UUID }[];

            const transcriptId = transcriptResult[0].id;
            expect(uuidValidate(transcriptId)).toBe(true);
            expect(uuidVersion(transcriptId)).toBe(7);

            // Test transcript_subjects table
            const tsResult = (await queryRunner.query(
                `
                INSERT INTO "uni_guide"."transcript_subjects" 
                (transcript_id, subject, score)
                VALUES 
                ($1, 'Toán', 9.5)
                RETURNING id
            `,
                [transcriptId],
            )) as { id: UUID }[];

            expect(uuidValidate(tsResult[0].id)).toBe(true);
            expect(uuidVersion(tsResult[0].id)).toBe(7);
        } finally {
            // Cleanup - the cascade deletes will handle most relationships
            // Just clean up the independent records
            await queryRunner.query(
                `DELETE FROM "uni_guide"."major_groups" WHERE code = 'TEST123'`,
            );
            await queryRunner.query(
                `DELETE FROM "uni_guide"."admissions" WHERE admission_code = 'TEST-ADM-001'`,
            );
            // Student and all related records will be cascade deleted when we delete the test user in afterAll
        }
    });

    it("should generate valid UUID v7 in machine_learning schema tables", async () => {
        try {
            // Test transcript_subject_group table
            const tsgResult = (await queryRunner.query(`
                INSERT INTO "machine_learning"."transcript_subject_group" 
                (uni_code, major_code, subject_combination)
                VALUES 
                ('TEST-UNI', 'TEST-MAJOR', 'A00')
                RETURNING id
            `)) as { id: UUID }[];

            expect(uuidValidate(tsgResult[0].id)).toBe(true);
            expect(uuidVersion(tsgResult[0].id)).toBe(7);

            // Test uni_l1 table
            // Create a 65-dimensional vector string in PostgreSQL format: '[0,0,0,...]'
            const vector65 = "[" + Array(65).fill(0).join(",") + "]";
            const uniL1Result = (await queryRunner.query(
                `
                INSERT INTO "machine_learning"."uni_l1" 
                (admission_code, tuition_fee, tfidf_content)
                VALUES 
                ('TEST-ADM-ML', 5000000, $1::vector)
                RETURNING id
            `,
                [vector65],
            )) as { id: UUID }[];

            expect(uuidValidate(uniL1Result[0].id)).toBe(true);
            expect(uuidVersion(uniL1Result[0].id)).toBe(7);

            // Test l2_uni_requirement table
            const l2Result = (await queryRunner.query(`
                INSERT INTO "machine_learning"."l2_uni_requirement" 
                (admission_code, province, subject_combination, score, is_base_row)
                VALUES 
                ('TEST-ADM-L2', 'Ho Chi Minh', 'A00', 25.5, true)
                RETURNING id
            `)) as { id: UUID }[];

            expect(uuidValidate(l2Result[0].id)).toBe(true);
            expect(uuidVersion(l2Result[0].id)).toBe(7);
        } finally {
            await queryRunner.query(
                `DELETE FROM "machine_learning"."transcript_subject_group" WHERE uni_code = 'TEST-UNI'`,
            );
            await queryRunner.query(
                `DELETE FROM "machine_learning"."uni_l1" WHERE admission_code = 'TEST-ADM-ML'`,
            );
            await queryRunner.query(
                `DELETE FROM "machine_learning"."l2_uni_requirement" WHERE admission_code = 'TEST-ADM-L2'`,
            );
        }
    });

    it("should verify UUID v7 contains timestamp component", async () => {
        const result1 = (await queryRunner.query(`SELECT uuidv7() as id`)) as {
            id: UUID;
        }[];
        const uuid1Data = result1[0];
        const uuid1 = uuid1Data.id;

        expect(uuidValidate(uuid1)).toBe(true);
        expect(uuidVersion(uuid1)).toBe(7);

        await new Promise((resolve) => setTimeout(resolve, 10));

        const result2 = (await queryRunner.query(`SELECT uuidv7() as id`)) as {
            id: UUID;
        }[];
        const uuid2Data = result2[0];
        const uuid2 = uuid2Data.id;

        expect(uuidValidate(uuid2)).toBe(true);
        expect(uuidVersion(uuid2)).toBe(7);
        expect(uuid2 > uuid1).toBe(true);

        const extractTimestamp = (uuid: UUID): bigint => {
            const hex = uuid.replace(/-/g, "");
            const timestampHex = hex.substring(0, 12);
            return BigInt(`0x${timestampHex}`);
        };

        const timestamp1 = extractTimestamp(uuid1);
        const timestamp2 = extractTimestamp(uuid2);

        expect(timestamp2).toBeGreaterThan(timestamp1);
    });

    it("should compare UUID v4 (gen_random_uuid) vs UUID v7", async () => {
        const v4Result = (await queryRunner.query(
            `SELECT gen_random_uuid() as id`,
        )) as { id: UUID }[];
        const v4Data = v4Result[0];
        const uuidV4 = v4Data.id;

        const v7Result = (await queryRunner.query(`SELECT uuidv7() as id`)) as {
            id: UUID;
        }[];
        const v7Data = v7Result[0];
        const uuidV7 = v7Data.id;

        expect(uuidValidate(uuidV4)).toBe(true);
        expect(uuidVersion(uuidV4)).toBe(4);

        expect(uuidValidate(uuidV7)).toBe(true);
        expect(uuidVersion(uuidV7)).toBe(7);
    });

    it("should verify existing v4 UUIDs remain valid after migration", async () => {
        const testEmail = "test-uuid-v4@example.com";

        try {
            const v4Result = (await queryRunner.query(
                `SELECT gen_random_uuid() as id`,
            )) as { id: UUID }[];
            const v4Data = v4Result[0];
            const uuidV4 = v4Data.id;

            expect(uuidValidate(uuidV4)).toBe(true);
            expect(uuidVersion(uuidV4)).toBe(4);

            await queryRunner.query(
                `
                INSERT INTO "security"."users" 
                (id, email, password, role, name)
                VALUES 
                ($1, $2, 'test-password', 'user', 'UUID v4 Test User')
            `,
                [uuidV4, testEmail],
            );

            const result = (await queryRunner.query(
                `SELECT id FROM "security"."users" WHERE email = $1`,
                [testEmail],
            )) as { id: UUID }[];

            const retrievedData = result[0];

            expect(retrievedData.id).toBe(uuidV4);
            expect(uuidValidate(retrievedData.id)).toBe(true);
            expect(uuidVersion(retrievedData.id)).toBe(4);
        } finally {
            await queryRunner.query(
                `DELETE FROM "security"."users" WHERE email = $1`,
                [testEmail],
            );
        }
    });

    it("should verify migration did not affect existing v4 records", async () => {
        const v4Uuids: string[] = [];
        const testEmails: string[] = [];

        try {
            for (let i = 0; i < 3; i++) {
                const v4Result = (await queryRunner.query(
                    `SELECT gen_random_uuid() as id`,
                )) as { id: UUID }[];
                const v4Data = v4Result[0];
                const uuidV4 = v4Data.id;

                expect(uuidValidate(uuidV4)).toBe(true);
                expect(uuidVersion(uuidV4)).toBe(4);

                v4Uuids.push(uuidV4);
                const email = `v4-migration-test-${String(i)}@example.com`;
                testEmails.push(email);

                await queryRunner.query(
                    `
                    INSERT INTO "security"."users" 
                    (id, email, password, role, name)
                    VALUES 
                    ($1, $2, 'test-password', 'user', 'V4 Migration Test')
                `,
                    [uuidV4, email],
                );
            }

            const results = (await queryRunner.query(
                `
                SELECT id FROM "security"."users" 
                WHERE email LIKE 'v4-migration-test-%@example.com'
                ORDER BY email
            `,
            )) as { id: UUID }[];

            expect(results).toHaveLength(3);

            for (let i = 0; i < results.length; i++) {
                const record = results[i];
                expect(record.id).toBe(v4Uuids[i]);
                expect(uuidValidate(record.id)).toBe(true);
                expect(uuidVersion(record.id)).toBe(4);
            }
        } finally {
            await queryRunner.query(
                `DELETE FROM "security"."users" WHERE email LIKE 'v4-migration-test-%@example.com'`,
            );
        }
    });

    it("should verify UUID v7 performance with bulk inserts", async () => {
        const bulkSize = 100;
        const testEmails: string[] = [];

        try {
            for (let i = 0; i < bulkSize; i++) {
                testEmails.push(`bulk-test-${String(i)}@example.com`);
            }

            const values = testEmails
                .map(
                    (email) =>
                        `('${email}', 'password', 'user', 'Bulk Test User')`,
                )
                .join(", ");

            const startTime = Date.now();
            const result = (await queryRunner.query(`
                INSERT INTO "security"."users" 
                (email, password, role, name)
                VALUES ${values}
                RETURNING id
            `)) as { id: UUID }[];
            const endTime = Date.now();

            expect(result).toHaveLength(bulkSize);

            const samplesToCheck = [0, Math.floor(bulkSize / 2), bulkSize - 1];

            for (const index of samplesToCheck) {
                const record = result[index];
                expect(uuidValidate(record.id)).toBe(true);
                expect(uuidVersion(record.id)).toBe(7);
            }

            const duration = endTime - startTime;
            expect(duration).toBeLessThan(5000);
        } finally {
            const emailList = testEmails
                .map((email) => `'${email}'`)
                .join(", ");
            await queryRunner.query(
                `DELETE FROM "security"."users" WHERE email IN (${emailList})`,
            );
        }
    });

    it("should verify UUID v7 sortability vs v4 randomness", async () => {
        const testRecords: { email: string; id: UUID; type: string }[] = [];

        try {
            for (let i = 0; i < 3; i++) {
                const result = (await queryRunner.query(
                    `
                    INSERT INTO "security"."users" 
                    (email, password, role, name)
                    VALUES 
                    ($1, 'password', 'user', 'Sort Test User')
                    RETURNING id, email
                `,
                    [`v7-sort-test-${String(i)}@example.com`],
                )) as { email: string; id: UUID }[];

                const record = result[0];

                expect(uuidValidate(record.id)).toBe(true);
                expect(uuidVersion(record.id)).toBe(7);

                testRecords.push({ ...record, type: "v7" });

                await new Promise((resolve) => setTimeout(resolve, 5));
            }

            for (let i = 0; i < 3; i++) {
                const v4Result = (await queryRunner.query(
                    `SELECT gen_random_uuid() as id`,
                )) as { id: UUID }[];
                const v4Data = v4Result[0];
                const uuidV4 = v4Data.id;

                expect(uuidValidate(uuidV4)).toBe(true);
                expect(uuidVersion(uuidV4)).toBe(4);

                await queryRunner.query(
                    `
                    INSERT INTO "security"."users" 
                    (id, email, password, role, name)
                    VALUES 
                    ($1, $2, 'password', 'user', 'V4 Sort Test User')
                `,
                    [uuidV4, `v4-sort-test-${String(i)}@example.com`],
                );

                testRecords.push({
                    email: `v4-sort-test-${String(i)}@example.com`,
                    id: uuidV4,
                    type: "v4",
                });
            }

            const v7Records = testRecords.filter((r) => r.type === "v7");

            for (let i = 1; i < v7Records.length; i++) {
                const current = v7Records[i];
                const previous = v7Records[i - 1];
                expect(current.id > previous.id).toBe(true);
            }
        } finally {
            await queryRunner.query(
                `DELETE FROM "security"."users" WHERE email LIKE 'v7-sort-test-%@example.com' OR email LIKE 'v4-sort-test-%@example.com'`,
            );
        }
    });

    it("should verify all schemas have tables with UUID v7", async () => {
        const schemas = ["security", "uni_guide", "machine_learning"];

        for (const schema of schemas) {
            const result = (await queryRunner.query(
                `
                SELECT 
                    table_name,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = $1
                AND column_name = 'id'
                AND data_type = 'uuid'
            `,
                [schema],
            )) as TableDefaultResult[];

            expect(result.length).toBeGreaterThan(0);

            const allUseV7 = result.every((row) =>
                row.column_default.includes("uuidv7()"),
            );
            expect(allUseV7).toBe(true);
        }
    });

    it("should validate UUID using uuid package and PostgreSQL", async () => {
        const v7Result = (await queryRunner.query(`SELECT uuidv7() as id`)) as {
            id: UUID;
        }[];
        const v7Data = v7Result[0];
        const uuidV7 = v7Data.id;

        const v4Result = (await queryRunner.query(
            `SELECT gen_random_uuid() as id`,
        )) as { id: UUID }[];
        const v4Data = v4Result[0];
        const uuidV4 = v4Data.id;

        // uuid package validation
        expect(uuidValidate(uuidV7)).toBe(true);
        expect(uuidVersion(uuidV7)).toBe(7);

        expect(uuidValidate(uuidV4)).toBe(true);
        expect(uuidVersion(uuidV4)).toBe(4);

        // PostgreSQL validation
        const pgValidationV7 = (await queryRunner.query(
            `SELECT $1::uuid IS NOT NULL as valid`,
            [uuidV7],
        )) as { valid: boolean }[];
        const validationResultV7 = pgValidationV7[0];
        expect(validationResultV7.valid).toBe(true);

        const pgValidationV4 = (await queryRunner.query(
            `SELECT $1::uuid IS NOT NULL as valid`,
            [uuidV4],
        )) as { valid: boolean }[];
        const validationResultV4 = pgValidationV4[0];
        expect(validationResultV4.valid).toBe(true);
    });

    it("should compare insert performance of UUID v4 (Random) vs UUID v7 (Sequential)", async () => {
        // Setup temporary tables to isolate the test
        // We use explicit DEFAULTs to force DB-side generation
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS temp_perf_v4 (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                payload TEXT
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS temp_perf_v7 (
                id UUID PRIMARY KEY DEFAULT uuidv7(),
                payload TEXT
            )
        `);

        try {
            // Number of records to insert (enough to trigger index page splits)
            const RECORD_COUNT = 50000;

            // Measure V4 (Random)
            // We use generate_series to keep the work inside the DB engine
            const startV4 = performance.now();
            await queryRunner.query(
                `
                INSERT INTO temp_perf_v4 (payload) 
                SELECT 'performance-test' 
                FROM generate_series(1, $1)
            `,
                [RECORD_COUNT],
            );
            const endV4 = performance.now();
            const timeV4 = endV4 - startV4;

            // Measure V7 (Sequential)
            const startV7 = performance.now();
            await queryRunner.query(
                `
                INSERT INTO temp_perf_v7 (payload) 
                SELECT 'performance-test' 
                FROM generate_series(1, $1)
            `,
                [RECORD_COUNT],
            );
            const endV7 = performance.now();
            const timeV7 = endV7 - startV7;

            console.table({
                "Ops/Sec": {
                    v4: (RECORD_COUNT / (timeV4 / 1000)).toFixed(0),
                    v7: (RECORD_COUNT / (timeV7 / 1000)).toFixed(0),
                },
                "Time (ms)": { v4: timeV4.toFixed(2), v7: timeV7.toFixed(2) },
                Winner: timeV7 < timeV4 ? "UUID v7" : "UUID v4", // Likely v7, but don't fail if v4 wins
            });

            // SANITY ASSERTION (The "Don't be broken" check)
            // Instead of asserting v7 < v4, assert that v7 is fast *enough*.
            // e.g., Ensure we can do at least 10,000 writes/sec (arbitrary safe baseline)
            const v7OpsPerSec = RECORD_COUNT / (timeV7 / 1000);
            expect(v7OpsPerSec).toBeGreaterThan(10000);

            // Loose Comparison (The "Regression" check)
            // Fail only if v7 is SIGNIFICANTLY slower (e.g., 2x slower) than v4
            // This catches major bugs without failing on minor noise.
            const ratio = timeV7 / timeV4;
            expect(ratio).toBeLessThan(2.0);

            // Validate Data Integrity
            const countV4 = (await queryRunner.query(
                `SELECT COUNT(*) as count FROM temp_perf_v4`,
            )) as CountResult[];

            const countV7 = (await queryRunner.query(
                `SELECT COUNT(*) as count FROM temp_perf_v7`,
            )) as CountResult[];

            expect(parseInt(countV4[0].count, 10)).toBe(RECORD_COUNT);
            expect(parseInt(countV7[0].count, 10)).toBe(RECORD_COUNT);
        } finally {
            // 5. Cleanup
            await queryRunner.query(`DROP TABLE IF EXISTS temp_perf_v4`);
            await queryRunner.query(`DROP TABLE IF EXISTS temp_perf_v7`);
        }
    });

    afterAll(async () => {
        // Clean up students that reference the test user
        if (testUserId) {
            await queryRunner.query(
                `DELETE FROM "uni_guide"."students" WHERE user_id = $1`,
                [testUserId],
            );

            // Then clean up the test user itself
            await queryRunner.query(
                `DELETE FROM "security"."users" WHERE id = $1`,
                [testUserId],
            );
        }

        if (!queryRunner.isReleased) {
            await queryRunner.release();
        }
    });
});
