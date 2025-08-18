// src/entity/certification.ts
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

import { StudentEntity } from "@/entity/student.js";
import { ExamType } from "@/type/enum/exam.js";

export enum CEFR {
    A1 = "A1",
    A2 = "A2",
    B1 = "B1",
    B2 = "B2",
    C1 = "C1",
    C2 = "C2",
}
@Entity({ name: "certifications" })
@Index("idx_certification_student_id", ["studentId"])
@Index("idx_certification_issue_date", ["issueDate"])
@Index("idx_certification_expiration_date", ["expirationDate"])
@Index("idx_certification_issuing_org", ["issuingOrganization"])
@Index("idx_certification_name", ["name"])
@Index("idx_certification_level", ["level"])
@Index("idx_certification_created_at", ["createdAt"])
@Index("idx_certification_modified_at", ["modifiedAt"])
export class CertificationEntity {
    @Column({
        enum: CEFR,
        nullable: true,
        type: "enum",
    })
    cefr?: CEFR;

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({
        insert: true,
        length: 255,
        nullable: true,
        type: "varchar",
        update: false,
    })
    createdBy?: string;

    @Column({ length: 100, nullable: true, type: "varchar" })
    credentialId?: string;

    @Column({ nullable: true, type: "jsonb" })
    examType?: ExamType;

    @Column({ nullable: true, type: "date" })
    expirationDate?: Date;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ nullable: true, type: "date" })
    issueDate?: Date;

    @Column({ length: 200, nullable: true, type: "varchar" })
    issuingOrganization?: string;

    @Column({ length: 50, nullable: true, type: "varchar" })
    level?: string;

    @Column({ length: 100, nullable: true, type: "varchar" })
    levelDescription?: string;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    modifiedAt!: Date;

    @Column({
        insert: false,
        length: 255,
        nullable: true,
        type: "varchar",
        update: true,
    })
    modifiedBy?: string;

    @Column({ length: 200, nullable: true, type: "varchar" })
    name?: string;

    @JoinColumn({ name: "studentId" })
    @ManyToOne("StudentEntity", "certifications", {
        onDelete: "CASCADE",
    })
    student!: Relation<StudentEntity>;

    @Column({ type: "uuid" })
    studentId!: string;

    constructor(certification?: Partial<CertificationEntity>) {
        if (certification) {
            Object.assign(this, certification);
        }
    }
}
