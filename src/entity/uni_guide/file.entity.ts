// src/entity/file.ts
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
    UpdateDateColumn,
} from "typeorm";

import { OcrResultEntity } from "@/entity/uni_guide/ocr-result.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";

/**
 * File status - must be one of: active, archived, deleted
 * @example "active"
 */
export enum FileStatus {
    ACTIVE = "active",
    ARCHIVED = "archived",
    DELETED = "deleted",
}

/**
 * File type - must be one of: certificate, document, image, other, portfolio, resume, transcript
 * @example "transcript"
 */
export enum FileType {
    CERTIFICATE = "certificate",
    DOCUMENT = "document",
    IMAGE = "image",
    OTHER = "other",
    PORTFOLIO = "portfolio",
    RESUME = "resume",
    TRANSCRIPT = "transcript",
}

@Entity({ name: "files", schema: "uni_guide" })
@Index("idx_file_student_id", ["studentId"])
@Index("idx_file_type", ["fileType"])
@Index("idx_file_status", ["status"])
@Index("idx_file_created_at", ["createdAt"])
@Index("idx_file_updated_at", ["updatedAt"])
export class FileEntity {
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

    @Column({
        length: 500,
        name: "description",
        nullable: true,
        type: "varchar",
    })
    description?: string;

    @Column({ name: "file_content", select: false, type: "bytea" })
    fileContent!: Buffer;

    @Column({ length: 255, name: "file_name", type: "varchar" })
    fileName!: string;

    @Column({ length: 500, name: "file_path", nullable: true, type: "varchar" })
    filePath!: string;

    @Column({ name: "file_size", type: "bigint" })
    fileSize!: number;

    @Column({
        default: FileType.OTHER,
        enum: FileType,
        name: "file_type",
        type: "enum",
    })
    fileType!: FileType;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "metadata", nullable: true, type: "jsonb" })
    metadata?: Record<string, unknown>;

    @Column({ length: 100, name: "mime_type", type: "varchar" })
    mimeType!: string;

    @OneToOne("OcrResultEntity", "file", {
        cascade: true,
        eager: false,
    })
    ocrResult?: Relation<OcrResultEntity>;

    @Column({ length: 255, name: "original_file_name", type: "varchar" })
    originalFileName!: string;

    @Column({
        default: FileStatus.ACTIVE,
        enum: FileStatus,
        name: "status",
        type: "enum",
    })
    status!: FileStatus;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "files", {
        eager: false,
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    student!: Relation<StudentEntity>;

    @Column({ name: "student_id", type: "uuid" })
    studentId!: string;

    @Column({ length: 255, name: "tags", nullable: true, type: "varchar" })
    tags?: string;

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

    constructor(file?: Partial<FileEntity>) {
        if (file) {
            Object.assign(this, file);
        }
    }

    // Existing helper methods
    getFileExtension(): string {
        return this.originalFileName.split(".").pop() ?? "";
    }

    getHumanReadableFileSize(): string {
        const bytes = this.fileSize;
        const units = ["B", "KB", "MB", "GB", "TB"];
        if (bytes === 0) return "0 B";
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = bytes / Math.pow(1024, i);
        return `${size.toFixed(2)} ${units[i]}`;
    }

    getTagsArray(): string[] {
        return this.tags ? this.tags.split(",").map((tag) => tag.trim()) : [];
    }

    isActive(): boolean {
        return this.status === FileStatus.ACTIVE;
    }

    isDocument(): boolean {
        const documentTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
        ];
        return documentTypes.includes(this.mimeType);
    }

    isImage(): boolean {
        return this.mimeType.startsWith("image/");
    }

    setTagsFromArray(tags: string[]): void {
        this.tags = tags.join(", ");
    }
}
