import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { AdmissionEntity } from "./admission.entity.js";
import { StudentEntity } from "./student.entity.js";

@Entity("student_admissions")
@Index("idx_student_admissions_student_id", ["studentId"])
@Index("idx_student_admissions_admission_id", ["admissionId"])
@Index("idx_student_admissions_composite", ["studentId", "admissionId"])
export class StudentAdmissionEntity {
    @JoinColumn({ name: "admission_id" })
    @ManyToOne("AdmissionEntity", "studentAdmissions", {
        nullable: false,
        onDelete: "CASCADE",
    })
    admission!: Relation<AdmissionEntity>;

    @Column({ name: "admission_id", type: "uuid" })
    admissionId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @UpdateDateColumn()
    modifiedAt!: Date;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "studentAdmissions", {
        nullable: false,
        onDelete: "CASCADE",
    })
    student!: Relation<StudentEntity>;

    @Column({ name: "student_id", type: "uuid" })
    studentId!: string;
}
