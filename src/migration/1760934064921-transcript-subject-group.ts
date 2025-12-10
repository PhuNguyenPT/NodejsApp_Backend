import type { MigrationInterface, QueryRunner } from "typeorm";

import csv from "csv-parser";
import fs from "fs";
import path from "path";
import stripBomStream from "strip-bom-stream";
import { fileURLToPath } from "url";

import { logger } from "@/config/logger.config.js";
import { TranscriptSubjectGroupEntity } from "@/entity/machine_learning/transcript-subject-group.entity.js";

interface TranscriptSubjectGroupCsvRow {
    major_code?: string;
    subject_combination?: string;
    uni_code?: string;
}

export class TranscriptSubjectGroup1760934064921 implements MigrationInterface {
    name = "TranscriptSubjectGroup1760934064921";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `TRUNCATE TABLE "machine_learning"."transcript_subject_group" RESTART IDENTITY CASCADE`,
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const csvPath = path.join(
            __dirname,
            "../data/transcript-subject-group-data.csv",
        );
        const batchSize = 2000;

        try {
            const totalRecords = await this.processCsvFile(
                csvPath,
                queryRunner,
                batchSize,
            );

            logger.info(
                `Successfully imported ${totalRecords.toString()} records from Transcript Subject Group CSV file.`,
            );
        } catch (error: unknown) {
            logger.error(
                "Failed to import Transcript Subject Group CSV data:",
                error,
            );
            throw error;
        }
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

        let batch: TranscriptSubjectGroupEntity[] = [];
        let fileRecords = 0;

        // Strip BOM before parsing CSV
        const stream = fs
            .createReadStream(csvPath, { encoding: "utf-8" })
            .pipe(stripBomStream())
            .pipe(csv({ separator: "," }));

        for await (const row of stream) {
            const csvRow = row as TranscriptSubjectGroupCsvRow;
            const record = new TranscriptSubjectGroupEntity();

            record.uniCode = csvRow.uni_code ?? "";
            record.majorCode = csvRow.major_code ?? "";
            record.subjectCombination = csvRow.subject_combination ?? "";

            batch.push(record);
            fileRecords++;

            if (batch.length >= batchSize) {
                logger.info(
                    `Saving batch of ${batch.length.toString()} records (total: ${fileRecords.toString()})...`,
                );
                await queryRunner.manager.save(
                    TranscriptSubjectGroupEntity,
                    batch,
                );
                batch = [];
            }
        }

        if (batch.length > 0) {
            logger.info(
                `Saving final batch of ${batch.length.toString()} records...`,
            );
            await queryRunner.manager.save(TranscriptSubjectGroupEntity, batch);
        }

        return fileRecords;
    }
}
