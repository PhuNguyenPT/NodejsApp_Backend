// student-aptitude-exam.entity.ts
import { Expose, Transform } from "class-transformer";
import {
    Column,
    CreateDateColumn,
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
    @Expose()
    createdAt!: Date;

    @Column({
        insert: true,
        length: 255,
        name: "created_by",
        nullable: true,
        type: "varchar",
        update: false,
    })
    @Expose()
    createdBy?: string;

    @Column({ enum: ExamType, name: "exam_type", type: "enum" })
    @Expose()
    examType!: ExamType;

    @Expose()
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string;

    @Column({ name: "score", type: "decimal" })
    @Expose()
    @Transform(({ value }) => {
        if (typeof value === "string") return parseFloat(value);
        if (typeof value === "number") return value;
        return 0;
    })
    score!: number;

    @Expose()
    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "aptitudeExams", {
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    student!: Relation<StudentEntity>;

    @Column({ name: "student_id", type: "uuid" })
    @Expose()
    studentId!: string;

    @Expose()
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
    @Expose()
    updatedBy?: string;

    /**
     * One-to-one relationship with VNUHCM score components
     * Only populated when examType is VNUHCM
     */
    @Expose()
    @OneToOne("VnuhcmScoreComponentEntity", "aptitudeExam", {
        cascade: true,
        eager: true,
        nullable: true,
    })
    vnuhcmScoreComponents?: Relation<VnuhcmScoreComponentEntity>;
}
