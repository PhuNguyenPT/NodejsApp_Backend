// src/entity/ocr.result.entity.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
    Unique,
    UpdateDateColumn,
} from "typeorm";

import { ISubjectScore, SubjectScore } from "@/dto/ocr/ocr.dto.js";
import { FileEntity } from "@/entity/uni_guide/file.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";

import { TranscriptEntity } from "./transcript.entity.js";

/**
 * OCR processing status
 */
export enum OcrStatus {
    COMPLETED = "completed",
    FAILED = "failed",
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

@Entity({ name: "ocr_results", schema: "uni_guide" })
@Index("idx_ocr_student_id", ["studentId"])
@Index("idx_ocr_file_id", ["fileId"])
@Index("idx_ocr_status", ["status"])
@Index("idx_ocr_created_at", ["createdAt"])
@Index("idx_ocr_updated_at", ["updatedAt"])
@Unique("uq_ocr_student_file", ["studentId", "fileId"])
export class OcrResultEntity {
    @CreateDateColumn({
        insert: true,
        name: "created_at",
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @Column({
        insert: true,
        length: 255,
        name: "created_by",
        nullable: true,
        type: "varchar",
        update: false,
    })
    createdBy?: string;

    @Column({ name: "document_annotation", nullable: true, type: "text" })
    documentAnnotation?: string;

    @Column({ name: "error_message", nullable: true, type: "text" })
    errorMessage?: string;

    @JoinColumn({ name: "file_id" })
    @OneToOne("FileEntity", "ocrResult", { onDelete: "CASCADE" })
    file!: Relation<FileEntity>;

    @Column({ name: "file_id", type: "uuid" })
    fileId!: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "metadata", nullable: true, type: "jsonb" })
    metadata?: OcrMetadata;

    @Column({ name: "scores", nullable: true, type: "jsonb" })
    scores?: SubjectScore[];

    @Column({
        enum: OcrStatus,
        name: "status",
        type: "enum",
    })
    status!: OcrStatus;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", { onDelete: "CASCADE" })
    student!: Relation<StudentEntity>;

    @Column({ name: "student_id", type: "uuid" })
    studentId!: string;

    @OneToOne("TranscriptEntity", "ocrResult", {
        nullable: true,
    })
    transcript?: Relation<TranscriptEntity>;

    @UpdateDateColumn({
        insert: false,
        name: "updated_at",
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;

    @Column({
        insert: false,
        length: 255,
        name: "updated_by",
        nullable: true,
        type: "varchar",
        update: true,
    })
    updatedBy?: string;

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

    getScoreBySubject(subjectName: string): ISubjectScore | null {
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
