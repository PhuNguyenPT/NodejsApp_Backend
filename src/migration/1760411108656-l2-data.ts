import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { MigrationInterface, QueryRunner } from "typeorm";
import { fileURLToPath } from "url";

import { logger } from "@/config/logger.config.js";
import { L2Entity } from "@/entity/l2.entity.js";

// Define the CSV row structure for type safety
interface L2CsvRow {
    academic_performance_grade_10?: string;
    academic_performance_grade_11?: string;
    academic_performance_grade_12?: string;
    admission_code?: string;
    certification_name?: string;
    certification_score?: string;
    certification_score_equivalence?: string;
    conduct_grade_10?: string;
    conduct_grade_11?: string;
    conduct_grade_12?: string;
    is_base_row?: string;
    major_code?: string;
    province?: string;
    score?: string;
    score_final?: string;
    subject_combination?: string;
    tuition_fee?: string;
    uni_type_label?: string;
    y_base?: string;
}

export class L2Data1760411108656 implements MigrationInterface {
    name = "L2Data1760411108656";

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Using `TRUNCATE` is a fast and effective way to clear the table.
        await queryRunner.query(
            `TRUNCATE TABLE "machine_learning"."l2_uni_requirement" RESTART IDENTITY`,
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const csvPath = path.join(
            __dirname,
            "../data/l2-uni-requirement-data.csv",
        );
        // Reduce batch size to avoid PostgreSQL parameter limit
        // With 19 columns per row: 1000 rows = 19,000 parameters (well under 65,535 limit)
        const batchSize = 1000;

        try {
            const totalRecords = await this.processCsvFile(
                csvPath,
                queryRunner,
                batchSize,
            );

            logger.info(
                `Successfully imported ${totalRecords.toString()} records from L2 CSV file.`,
            );
        } catch (error: unknown) {
            logger.error("Failed to import L2 CSV data:", error);
            // Re-throwing the error ensures TypeORM rolls back the transaction.
            throw error;
        }
    }

    /**
     * Parse decimal numbers that may use comma as decimal separator
     * e.g., "22,79" becomes 22.79
     */
    private parseDecimal(value: string): number {
        const normalized = value.replace(",", ".");
        return parseFloat(normalized) || 0;
    }

    private async processCsvFile(
        csvPath: string,
        queryRunner: QueryRunner,
        batchSize = 1000,
    ): Promise<number> {
        logger.info(`Processing CSV file: ${csvPath}`);

        if (!fs.existsSync(csvPath)) {
            const errorMsg = `CSV file not found at path: ${csvPath}`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        let batch: L2Entity[] = [];
        let fileRecords = 0;

        // Note: CSV uses semicolon as delimiter
        const stream = fs
            .createReadStream(csvPath, { encoding: "utf-8" })
            .pipe(csv({ separator: ";" }));

        // Use 'for await...of' to reliably process the stream.
        for await (const row of stream) {
            const csvRow = row as L2CsvRow;
            const l2Record = new L2Entity();

            l2Record.uniTypeLabel =
                parseInt(csvRow.uni_type_label ?? "0", 10) || 0;
            l2Record.province = csvRow.province ?? "";
            l2Record.subjectCombination = csvRow.subject_combination ?? "";

            // Handle decimal numbers with comma separator
            l2Record.score = this.parseDecimal(csvRow.score ?? "0");
            l2Record.tuitionFee = parseFloat(csvRow.tuition_fee ?? "0") || 0;

            l2Record.certificationName =
                parseInt(csvRow.certification_name ?? "0", 10) || 0;
            l2Record.certificationScore =
                parseInt(csvRow.certification_score ?? "0", 10) || 0;
            l2Record.certificationScoreEquivalence =
                parseInt(csvRow.certification_score_equivalence ?? "0", 10) ||
                0;

            l2Record.conduct_grade_10 =
                parseInt(csvRow.conduct_grade_10 ?? "0", 10) || 0;
            l2Record.conduct_grade_11 =
                parseInt(csvRow.conduct_grade_11 ?? "0", 10) || 0;
            l2Record.conduct_grade_12 =
                parseInt(csvRow.conduct_grade_12 ?? "0", 10) || 0;

            l2Record.academic_performance_grade_10 =
                parseInt(csvRow.academic_performance_grade_10 ?? "0", 10) || 0;
            l2Record.academic_performance_grade_11 =
                parseInt(csvRow.academic_performance_grade_11 ?? "0", 10) || 0;
            l2Record.academic_performance_grade_12 =
                parseInt(csvRow.academic_performance_grade_12 ?? "0", 10) || 0;

            l2Record.majorCode = parseInt(csvRow.major_code ?? "0", 10) || 0;
            l2Record.admissionCode = csvRow.admission_code ?? "";

            l2Record.yBase = this.parseDecimal(csvRow.y_base ?? "0");
            l2Record.scoreFinal = this.parseDecimal(csvRow.score_final ?? "0");

            l2Record.isBaseRow = csvRow.is_base_row?.toUpperCase() === "TRUE";

            batch.push(l2Record);
            fileRecords++;

            // When the batch is full, save it to the database and reset it.
            if (batch.length >= batchSize) {
                logger.info(
                    `Saving batch of ${batch.length.toString()} records (total: ${fileRecords.toString()})...`,
                );
                await queryRunner.manager.save(L2Entity, batch);
                batch = []; // Reset the batch for the next set of records
            }
        }

        // After the loop, save any remaining records in the final batch.
        if (batch.length > 0) {
            logger.info(
                `Saving final batch of ${batch.length.toString()} records...`,
            );
            await queryRunner.manager.save(L2Entity, batch);
        }

        logger.info(
            `Successfully imported ${fileRecords.toString()} records from L2 CSV`,
        );
        return fileRecords;
    }
}
