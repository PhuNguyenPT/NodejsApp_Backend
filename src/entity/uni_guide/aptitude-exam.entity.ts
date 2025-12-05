// student-aptitude-exam.entity.ts
import {
    Column,
    CreateDateColumn,
    DeepPartial,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { ExamType } from "@/type/enum/exam-type.js";

import { StudentEntity } from "./student.entity.js";
import { VnuhcmScoreComponentEntity } from "./vnuhcm-score-component.entity.js";

@Entity({ name: "aptitude_exams", schema: "uni_guide" })
export class AptitudeExamEntity {
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

    @Column({ enum: ExamType, name: "exam_type", type: "enum" })
    examType!: ExamType;

    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string;

    @Column({ name: "score", type: "decimal" })
    score!: number;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "aptitudeExams", {
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    student!: Relation<StudentEntity>;

    @Column({ name: "student_id", type: "uuid" })
    studentId!: string;

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

    /**
     * One-to-one relationship with VNUHCM score components
     * Only populated when examType is VNUHCM
     */
    @OneToOne("VnuhcmScoreComponentEntity", "aptitudeExam", {
        cascade: true,
        eager: true,
        nullable: true,
    })
    vnuhcmScoreComponents?: Relation<VnuhcmScoreComponentEntity>;

    constructor(entityLike?: DeepPartial<AptitudeExamEntity>) {
        Object.assign(this, entityLike);
    }
}
