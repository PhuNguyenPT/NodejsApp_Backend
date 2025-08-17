// src/entity/ocr.result.entity.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { SubjectScore } from "@/dto/predict/ocr.js";
import { FileEntity } from "@/entity/file.js";
import { StudentEntity } from "@/entity/student.js";

/**
 * OCR processing status
 */
export enum OcrStatus {
    COMPLETED = "completed",
    FAILED = "failed",
    PARTIAL = "partial", // Some files processed, some failed
    PENDING = "pending",
    PROCESSING = "processing",
}

/**
 * OCR processing metadata
 */
export interface OcrMetadata {
    extractedAt: Date;
    failedFiles: number;
    ocrModel?: string;
    processingTimeMs: number;
    successfulFiles: number;
    totalFilesProcessed: number;
}

@Entity({ name: "ocr_results" })
@Index("idx_ocr_student_id", ["studentId"])
@Index("idx_ocr_file_id", ["fileId"])
@Index("idx_ocr_status", ["status"])
@Index("idx_ocr_created_at", ["createdAt"])
@Index("idx_ocr_student_file", ["studentId", "fileId"]) // Composite index for querying by student and file
export class OcrResultEntity {
    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({ nullable: true, type: "text" })
    documentAnnotation?: string;

    @Column({ nullable: true, type: "text" })
    errorMessage?: string;

    @JoinColumn({ name: "fileId" })
    @ManyToOne(() => FileEntity, { onDelete: "CASCADE" })
    file!: FileEntity; // Now required

    @Column({ type: "uuid" })
    fileId!: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ nullable: true, type: "jsonb" })
    metadata?: OcrMetadata;

    @Column({ length: 255, nullable: true, type: "varchar" })
    processedBy?: string;

    @Column({ nullable: true, type: "jsonb" })
    scores?: SubjectScore[];

    @Column({
        default: OcrStatus.PENDING,
        enum: OcrStatus,
        type: "enum",
    })
    status!: OcrStatus;

    @JoinColumn({ name: "studentId" })
    @ManyToOne(() => StudentEntity, { onDelete: "CASCADE" })
    student!: StudentEntity;

    @Column({ type: "uuid" })
    studentId!: string;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updatedAt!: Date;

    constructor(ocrResult?: Partial<OcrResultEntity>) {
        if (ocrResult) {
            Object.assign(this, ocrResult);
        }
    }

    getAverageScore(): null | number {
        if (!this.scores || this.scores.length === 0) {
            return null;
        }

        const validScores = this.scores.filter((score) => !isNaN(score.score));

        if (validScores.length === 0) {
            return null;
        }

        const total = validScores.reduce((sum, score) => sum + score.score, 0);
        return total / validScores.length;
    }

    getProcessingDuration(): string {
        if (!this.metadata?.processingTimeMs) {
            return "Unknown";
        }

        const ms = this.metadata.processingTimeMs;
        if (ms < 1000) {
            return `${ms.toString()}ms`;
        } else if (ms < 60000) {
            return `${(ms / 1000).toFixed(1)}s`;
        } else {
            return `${(ms / 60000).toFixed(1)}m`;
        }
    }

    getScoreBySubject(subjectName: string): null | SubjectScore {
        return (
            this.scores?.find(
                (score) =>
                    score.name.toLowerCase() === subjectName.toLowerCase(),
            ) ?? null
        );
    }

    // Helper methods
    getTotalScores(): number {
        return this.scores?.length ?? 0;
    }

    hasErrors(): boolean {
        return this.status === OcrStatus.FAILED || !!this.errorMessage;
    }

    isSuccessful(): boolean {
        return (
            this.status === OcrStatus.COMPLETED &&
            (this.scores?.length ?? 0) > 0
        );
    }
}
