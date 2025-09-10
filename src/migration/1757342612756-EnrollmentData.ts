import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { MigrationInterface, QueryRunner } from "typeorm";
import { fileURLToPath } from "url";

import { EnrollmentEntity } from "@/entity/enrollment.entity.js";
import logger from "@/util/logger.js";

// Define the CSV row structure for type safety
interface EnrollmentCsvRow {
    enroll_code?: string;
    enroll_type?: string;
    enroll_type_name?: string;
    major_code?: string;
    major_name?: string;
    province?: string;
    study_program?: string;
    subject_combination?: string;
    tuition_fee?: string;
    uni_code?: string;
    uni_name?: string;
    uni_type?: string;
    uni_web_link?: string;
}

export class EnrollmentData1757342612756 implements MigrationInterface {
    name = "EnrollmentData1757342612756";

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Using `TRUNCATE` is a fast and effective way to clear the table.
        await queryRunner.query(`TRUNCATE TABLE "enrollment" RESTART IDENTITY`);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const csvPath = path.join(__dirname, "../data/enrollment.data.csv");

        logger.info(`Attempting to read CSV file from: ${csvPath}`);
        if (!fs.existsSync(csvPath)) {
            const errorMsg = `Migration failed: CSV file not found at path: ${csvPath}`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        // To improve performance, we'll process and save records in batches
        // instead of loading the entire file into memory.
        const batchSize = 1000;
        let batch: EnrollmentEntity[] = [];
        let totalRecords = 0;

        // Note: For this to work correctly, your CSV file MUST be saved with UTF-8 encoding.
        const stream = fs
            .createReadStream(csvPath, { encoding: "utf-8" })
            .pipe(csv());

        try {
            // Use 'for await...of' to reliably process the stream.
            for await (const row of stream) {
                const csvRow = row as EnrollmentCsvRow;
                const enrollment = new EnrollmentEntity();

                enrollment.enrollCode = csvRow.enroll_code ?? "";
                enrollment.uniCode = csvRow.uni_code ?? "";
                enrollment.uniName = csvRow.uni_name ?? "";
                enrollment.majorCode =
                    parseInt(csvRow.major_code ?? "0", 10) || 0;
                enrollment.majorName = csvRow.major_name ?? "";
                enrollment.studyProgram = csvRow.study_program ?? "";
                enrollment.enrollType = csvRow.enroll_type ?? "";
                enrollment.enrollTypeName = csvRow.enroll_type_name ?? "";
                enrollment.subjectCombination =
                    csvRow.subject_combination ?? "";
                enrollment.tuitionFee =
                    parseInt(csvRow.tuition_fee ?? "0", 10) || 0;
                enrollment.province = csvRow.province ?? "";
                enrollment.uniType = csvRow.uni_type ?? "";
                enrollment.uniWebLink = csvRow.uni_web_link ?? "";

                batch.push(enrollment);
                totalRecords++;

                // When the batch is full, save it to the database and reset it.
                if (batch.length >= batchSize) {
                    logger.info(
                        `Saving a batch of ${batch.length.toString()} records...`,
                    );
                    await queryRunner.manager.save(EnrollmentEntity, batch);
                    batch = []; // Reset the batch for the next set of records
                }
            }

            // After the loop, save any remaining records in the final batch.
            if (batch.length > 0) {
                logger.info(
                    `Saving the final batch of ${batch.length.toString()} records...`,
                );
                await queryRunner.manager.save(EnrollmentEntity, batch);
            }

            logger.info(
                `Successfully imported ${totalRecords.toString()} records from CSV.`,
            );
        } catch (error: unknown) {
            logger.error("Failed to import CSV data:", error);
            // Re-throwing the error ensures TypeORM rolls back the transaction.
            throw error;
        }
    }
}
