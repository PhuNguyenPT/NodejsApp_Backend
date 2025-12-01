import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { OcrResultEntity } from "./ocr-result.entity.js";
import { StudentEntity } from "./student.entity.js";
import { TranscriptSubjectEntity } from "./transcript-subject.entity.js";

@Entity({ name: "transcripts", schema: "uni_guide" })
export class TranscriptEntity {
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

    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string;

    @JoinColumn({ name: "ocr_result_id" })
    @OneToOne("OcrResultEntity", "transcript", {
        nullable: true,
        onDelete: "SET NULL",
    })
    ocrResult?: Relation<OcrResultEntity>;

    @Column({ name: "ocr_result_id", nullable: true, type: "uuid" })
    ocrResultId?: string;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "transcripts", {
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    student!: Relation<StudentEntity>;

    @Column({ name: "student_id", type: "uuid" })
    studentId!: string;

    @OneToMany("TranscriptSubjectEntity", "transcript", {
        cascade: true,
        eager: false,
        nullable: true,
    })
    transcriptSubjects?: Relation<TranscriptSubjectEntity[]>;

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
}
