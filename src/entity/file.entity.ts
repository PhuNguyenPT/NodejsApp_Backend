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

import { OcrResultEntity } from "@/entity/ocr-result.entity.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { UserEntity } from "@/entity/user.entity.js";

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
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @Column({
        insert: true,
        length: 255,
        nullable: true,
        type: "varchar",
        update: false,
    })
    createdBy?: string;

    @Column({ length: 500, nullable: true, type: "varchar" })
    description?: string;

    @Column({ type: "bytea" }) // PostgreSQL binary data type
    fileContent!: Buffer;

    @Column({ length: 255, type: "varchar" })
    fileName!: string;

    @Column({ length: 500, nullable: true, type: "varchar" })
    filePath!: string;

    @Column({ type: "bigint" })
    fileSize!: number;

    @Column({
        default: FileType.OTHER,
        enum: FileType,
        type: "enum",
    })
    fileType!: FileType;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ nullable: true, type: "jsonb" })
    metadata?: Record<string, unknown>;

    @Column({ length: 100, type: "varchar" })
    mimeType!: string;

    @OneToOne("OcrResultEntity", "file", {
        cascade: true,
        eager: false,
    })
    ocrResult?: Relation<OcrResultEntity>;

    @Column({ length: 255, type: "varchar" })
    originalFileName!: string;

    @Column({
        default: FileStatus.ACTIVE,
        enum: FileStatus,
        type: "enum",
    })
    status!: FileStatus;

    @JoinColumn({ name: "studentId" })
    @ManyToOne("StudentEntity", "files", {
        eager: false,
        onDelete: "CASCADE",
    })
    student!: Relation<StudentEntity>;

    @Column({ type: "uuid" })
    studentId!: string;

    @Column({ length: 255, nullable: true, type: "varchar" })
    tags?: string;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;

    @Column({
        insert: false,
        length: 255,
        nullable: true,
        type: "varchar",
        update: true,
    })
    updatedBy?: string;

    @JoinColumn({ name: "userId" })
    @ManyToOne("UserEntity", "studentEntities", {
        eager: false,
        nullable: true,
        onDelete: "SET NULL",
    })
    user?: Relation<UserEntity>;

    @Column({ nullable: true, type: "uuid" })
    userId?: string;

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
