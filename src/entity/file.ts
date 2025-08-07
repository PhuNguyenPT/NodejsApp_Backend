// src/entity/file.ts
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

import { StudentEntity } from "@/entity/student.js";
import { UserEntity } from "@/entity/user.js";
import { Role } from "@/type/enum/user";

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

@Entity({ name: "files" })
@Index("idx_file_student_id", ["studentId"])
@Index("idx_file_type", ["fileType"])
@Index("idx_file_status", ["status"])
@Index("idx_file_uploaded_by", ["uploadedBy"])
@Index("idx_file_created_at", ["createdAt"])
@Index("idx_file_modified_at", ["modifiedAt"])
export class FileEntity {
    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({
        default: Role.ANONYMOUS,
        length: 255,
        nullable: true,
        type: "varchar",
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

    @UpdateDateColumn({ type: "timestamp with time zone" })
    modifiedAt!: Date;

    @Column({
        default: Role.ANONYMOUS,
        length: 255,
        nullable: true,
        type: "varchar",
    })
    modifiedBy?: string;

    @Column({ length: 255, type: "varchar" })
    originalFileName!: string;

    @Column({
        default: FileStatus.ACTIVE,
        enum: FileStatus,
        type: "enum",
    })
    status!: FileStatus;

    @JoinColumn({ name: "studentId" })
    @ManyToOne(() => StudentEntity, (student) => student.files, {
        eager: false,
        onDelete: "CASCADE",
    })
    student!: StudentEntity;

    // Foreign key to student
    @Column({ type: "uuid" })
    studentId!: string;

    @Column({ length: 255, nullable: true, type: "varchar" })
    tags?: string;

    // Optional: Track who uploaded the file
    @Column({ nullable: true, type: "uuid" })
    uploadedBy?: string;

    @JoinColumn({ name: "uploadedBy" })
    @ManyToOne(() => UserEntity, {
        eager: false,
        nullable: true,
        onDelete: "SET NULL",
    })
    uploader?: UserEntity;

    constructor(file?: Partial<FileEntity>) {
        if (file) {
            Object.assign(this, file);
        }
    }

    // Helper methods
    getFileExtension(): string {
        return this.originalFileName.split(".").pop() ?? "";
    }

    getHumanReadableFileSize(): string {
        const bytes = Number(this.fileSize);
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
