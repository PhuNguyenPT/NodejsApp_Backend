import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { MigrationInterface, QueryRunner } from "typeorm";
import { fileURLToPath } from "url";

import { logger } from "@/config/logger.config.js";
import { AdmissionEntity } from "@/entity/uni_guide/admission.entity.js";

// Define the CSV row structure for type safety
interface AdmissionCsvRow {
    admission_code?: string;
    admission_type?: string;
    admission_type_name?: string;
    major_code?: string;
    major_group?: number; // Present in transcript-admission-data.csv
    major_name?: string;
    province?: string;
    score?: number; // Present in transcript-admission-data.csv
    study_program?: string;
    subject_combination?: string;
    tuition_fee?: string;
    uni_code?: string;
    uni_name?: string;
    uni_type?: string;
    uni_web_link?: string;
}

export class AdmissionData1757342612756 implements MigrationInterface {
    name = "AdmissionData1757342612756";

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Using `TRUNCATE` is a fast and effective way to clear the table.
        await queryRunner.query(
            `TRUNCATE TABLE "uni_guide"."admissions" RESTART IDENTITY CASCADE`,
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // Define paths for all CSV files
        const csvFiles = [
            path.join(__dirname, "../data/admission-data.csv"),
            path.join(__dirname, "../data/priority-admission-data.csv"),
            path.join(__dirname, "../data/transcript-admission-data.csv"),
        ];

        const batchSize = 2000;
        let totalRecords = 0;

        try {
            // Process each CSV file sequentially
            for (const csvPath of csvFiles) {
                const fileRecords = await this.processCsvFile(
                    csvPath,
                    queryRunner,
                    batchSize,
                );
                totalRecords += fileRecords;
            }

            logger.info(
                `Successfully imported ${totalRecords.toString()} total records from all admission CSV files.`,
            );
        } catch (error: unknown) {
            logger.error("Failed to import CSV data:", error);
            // Re-throwing the error ensures TypeORM rolls back the transaction.
            throw error;
        }
    }

    /**
     * Helper function to parse integer values from CSV
     * Returns undefined for empty/invalid values
     */
    private parseIntOrUndefined(value?: number | string): number | undefined {
        if (value === undefined) {
            return undefined;
        }

        if (typeof value === "number") {
            return isNaN(value) ? undefined : value;
        }

        const trimmed = value.trim();
        if (trimmed === "") {
            return undefined;
        }

        const parsed = parseInt(trimmed, 10);
        return isNaN(parsed) ? undefined : parsed;
    }

    /**
     * Helper function to parse string values from CSV
     * Returns undefined for empty strings
     */
    private parseStringOrUndefined(value?: string): string | undefined {
        if (value === undefined) {
            return undefined;
        }

        const trimmed = value.trim();
        return trimmed === "" ? undefined : trimmed;
    }

    private async processCsvFile(
        csvPath: string,
        queryRunner: QueryRunner,
        batchSize = 5000,
    ): Promise<number> {
        const fileName = path.basename(csvPath);
        logger.info(`Processing CSV file: ${fileName}`);

        if (!fs.existsSync(csvPath)) {
            const errorMsg = `CSV file not found at path: ${csvPath}`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        let batch: AdmissionEntity[] = [];
        let fileRecords = 0;
        let skippedRecords = 0;

        // Note: For this to work correctly, your CSV file MUST be saved with UTF-8 encoding.
        const stream = fs
            .createReadStream(csvPath, { encoding: "utf-8" })
            .pipe(csv());

        // Use 'for await...of' to reliably process the stream.
        for await (const row of stream) {
            const csvRow = row as AdmissionCsvRow;

            // Skip rows with missing critical fields
            if (!csvRow.admission_code || !csvRow.uni_code) {
                skippedRecords++;
                continue;
            }

            const admission = new AdmissionEntity();

            // Use helper functions to properly handle nullable fields
            admission.admissionCode = this.parseStringOrUndefined(
                csvRow.admission_code,
            );
            admission.uniCode = this.parseStringOrUndefined(csvRow.uni_code);
            admission.uniName = this.parseStringOrUndefined(csvRow.uni_name);
            admission.majorCode = this.parseIntOrUndefined(csvRow.major_code);
            admission.majorGroup = this.parseIntOrUndefined(csvRow.major_group);
            admission.majorName = this.parseStringOrUndefined(
                csvRow.major_name,
            );
            admission.studyProgram = this.parseStringOrUndefined(
                csvRow.study_program,
            );
            admission.admissionType = this.parseStringOrUndefined(
                csvRow.admission_type,
            );
            admission.admissionTypeName = this.parseStringOrUndefined(
                csvRow.admission_type_name,
            );
            admission.subjectCombination = this.parseStringOrUndefined(
                csvRow.subject_combination,
            );
            admission.tuitionFee = this.parseIntOrUndefined(csvRow.tuition_fee);
            admission.province = this.parseStringOrUndefined(csvRow.province);
            admission.uniType = this.parseStringOrUndefined(csvRow.uni_type);
            admission.uniWebLink = this.parseStringOrUndefined(
                csvRow.uni_web_link,
            );
            admission.score = this.parseIntOrUndefined(csvRow.score);

            batch.push(admission);
            fileRecords++;

            // When the batch is full, save it to the database and reset it.
            if (batch.length >= batchSize) {
                logger.info(
                    `Saving a batch of ${batch.length.toString()} records from ${fileName}...`,
                );
                await queryRunner.manager.save(AdmissionEntity, batch);
                batch = []; // Reset the batch for the next set of records
            }
        }

        // After the loop, save any remaining records in the final batch.
        if (batch.length > 0) {
            logger.info(
                `Saving the final batch of ${batch.length.toString()} records from ${fileName}...`,
            );
            await queryRunner.manager.save(AdmissionEntity, batch);
        }

        logger.info(
            `Successfully imported ${fileRecords.toString()} records from ${fileName}${skippedRecords > 0 ? ` (skipped ${skippedRecords.toString()} invalid records)` : ""}`,
        );

        return fileRecords;
    }
}
