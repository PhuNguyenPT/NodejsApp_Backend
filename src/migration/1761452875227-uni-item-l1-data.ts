import { ParquetReader } from "@dsnp/parquetjs";
import fs from "fs";
import path from "path";
import { MigrationInterface, QueryRunner } from "typeorm";
import { fileURLToPath } from "url";

import { logger } from "@/config/logger.config.js";
import { UniL1Entity } from "@/entity/machine_learning/uni_l1.entity.js";

// Define the Parquet row structure for type safety
interface TfidfContentStructure {
    list: { element: number }[];
}

interface UniL1ParquetRow {
    admission_code?: string;
    tfidf_content?: TfidfContentStructure;
    tuition_fee?: number;
}

export class UniItemL1Data1761452875227 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `TRUNCATE TABLE "machine_learning"."uni_l1" RESTART IDENTITY CASCADE`,
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const parquetPath = path.join(
            __dirname,
            "../data/uni-item-l1-data.parquet",
        );
        const batchSize = 20000;

        try {
            const totalRecords = await this.processParquetFile(
                parquetPath,
                queryRunner,
                batchSize,
            );

            logger.info(
                `Successfully imported ${totalRecords.toString()} records from UniL1 Parquet file.`,
            );
        } catch (error: unknown) {
            logger.error("Failed to import UniL1 Parquet data:", error);
            throw error;
        }
    }

    private async processParquetFile(
        parquetPath: string,
        queryRunner: QueryRunner,
        batchSize = 1000,
    ): Promise<number> {
        logger.info(`Processing Parquet file: ${parquetPath}`);

        if (!fs.existsSync(parquetPath)) {
            const errorMsg = `Parquet file not found at path: ${parquetPath}`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        let batch: UniL1Entity[] = [];
        let fileRecords = 0;

        const reader = await ParquetReader.openFile(parquetPath);
        const cursor = reader.getCursor();

        let record = (await cursor.next()) as null | UniL1ParquetRow;

        while (record != null) {
            const uniL1Record = new UniL1Entity();

            uniL1Record.admissionCode = record.admission_code ?? null;
            uniL1Record.tuitionFee = record.tuition_fee ?? null;

            // Handle tfidf_content - convert from nested structure to flat array
            // Store in vector format: [1,2,3] not "[1,2,3]"
            if (!record.tfidf_content) {
                uniL1Record.tfidfContent = null;
            } else if (Array.isArray(record.tfidf_content.list)) {
                const flatArray = record.tfidf_content.list.map(
                    (item) => item.element,
                );
                // Use vector format: [x,y,z] without JSON.stringify
                uniL1Record.tfidfContent =
                    flatArray.length === 0 ? "[]" : `[${flatArray.join(",")}]`;
            } else {
                uniL1Record.tfidfContent = null;
            }

            batch.push(uniL1Record);
            fileRecords++;

            if (batch.length >= batchSize) {
                logger.info(
                    `Saving batch of ${batch.length.toString()} records (total: ${fileRecords.toString()})...`,
                );
                await queryRunner.manager.save(UniL1Entity, batch);
                batch = [];
            }

            record = (await cursor.next()) as null | UniL1ParquetRow;
        }

        if (batch.length > 0) {
            logger.info(
                `Saving final batch of ${batch.length.toString()} records...`,
            );
            await queryRunner.manager.save(UniL1Entity, batch);
        }

        await reader.close();

        return fileRecords;
    }
}
