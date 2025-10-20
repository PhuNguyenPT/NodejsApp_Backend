import csv from "csv-parser";
import fs from "fs";
import path from "path";
import stripBomStream from "strip-bom-stream";
import { MigrationInterface, QueryRunner } from "typeorm";
import { fileURLToPath } from "url";

import { logger } from "@/config/logger.config.js";
import { L3Entity } from "@/entity/l3.entity.js";

interface L3CsvRow {
    major_code?: string;
    major_group?: string;
    major_name?: string;
    province?: string;
    score?: string;
    tuition_fee?: string;
    uni_code?: string;
    uni_type?: string;
}

export class L3Data1760925742503 implements MigrationInterface {
    name = "L3Data1760925742503";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `TRUNCATE TABLE "machine_learning"."l3_transcript" RESTART IDENTITY`,
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const csvPath = path.join(__dirname, "../data/l3-transcript-data.csv");
        const batchSize = 2000;

        try {
            const totalRecords = await this.processCsvFile(
                csvPath,
                queryRunner,
                batchSize,
            );

            logger.info(
                `Successfully imported ${totalRecords.toString()} records from L3 CSV file.`,
            );
        } catch (error: unknown) {
            logger.error("Failed to import L3 CSV data:", error);
            throw error;
        }
    }

    private parseDecimal(value: string): number {
        const normalized = value.replace(",", ".");
        return parseFloat(normalized) || 0;
    }

    private async processCsvFile(
        csvPath: string,
        queryRunner: QueryRunner,
        batchSize = 2000,
    ): Promise<number> {
        logger.info(`Processing CSV file: ${csvPath}`);

        if (!fs.existsSync(csvPath)) {
            const errorMsg = `CSV file not found at path: ${csvPath}`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        let batch: L3Entity[] = [];
        let fileRecords = 0;

        // Strip BOM before parsing CSV
        const stream = fs
            .createReadStream(csvPath, { encoding: "utf-8" })
            .pipe(stripBomStream())
            .pipe(csv({ separator: ";" }));

        for await (const row of stream) {
            const csvRow = row as L3CsvRow;
            const l3Record = new L3Entity();

            l3Record.uni_code = csvRow.uni_code ?? "";
            l3Record.major_code = csvRow.major_code ?? "";
            l3Record.major_name = csvRow.major_name ?? "";
            l3Record.score = this.parseDecimal(csvRow.score ?? "0");
            l3Record.major_group = parseInt(csvRow.major_group ?? "0", 10) || 0;
            l3Record.province = csvRow.province ?? "";
            l3Record.uni_type = parseInt(csvRow.uni_type ?? "0", 10) || 0;
            l3Record.tuition_fee = parseFloat(csvRow.tuition_fee ?? "0") || 0;

            batch.push(l3Record);
            fileRecords++;

            if (batch.length >= batchSize) {
                logger.info(
                    `Saving batch of ${batch.length.toString()} records (total: ${fileRecords.toString()})...`,
                );
                await queryRunner.manager.save(L3Entity, batch);
                batch = [];
            }
        }

        if (batch.length > 0) {
            logger.info(
                `Saving final batch of ${batch.length.toString()} records...`,
            );
            await queryRunner.manager.save(L3Entity, batch);
        }

        logger.info(
            `Successfully imported ${fileRecords.toString()} records from L3 CSV`,
        );
        return fileRecords;
    }
}
