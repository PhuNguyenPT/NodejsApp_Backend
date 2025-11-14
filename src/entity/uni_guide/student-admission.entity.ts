import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
    Unique,
    UpdateDateColumn,
} from "typeorm";

import { AdmissionEntity } from "./admission.entity.js";
import { StudentEntity } from "./student.entity.js";

@Entity({ name: "student_admissions", schema: "uni_guide" })
@Index("idx_student_admissions_student_id", ["studentId"])
@Index("idx_student_admissions_admission_id", ["admissionId"])
@Index("idx_student_admissions_composite", ["studentId", "admissionId"])
@Index("idx_student_admissions_created_at", ["createdAt"])
@Index("idx_student_admissions_updated_at", ["updatedAt"])
@Unique("uq_student_admission", ["studentId", "admissionId"])
export class StudentAdmissionEntity {
    @JoinColumn({ name: "admission_id" })
    @ManyToOne("AdmissionEntity", "studentAdmissions", {
        nullable: false,
        onDelete: "CASCADE",
    })
    admission!: Relation<AdmissionEntity>;

    @Column({ name: "admission_id", type: "uuid" })
    admissionId!: string;

    @CreateDateColumn({
        insert: true,
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "studentAdmissions", {
        nullable: false,
        onDelete: "CASCADE",
    })
    student!: Relation<StudentEntity>;

    @Column({ name: "student_id", type: "uuid" })
    studentId!: string;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;
}
