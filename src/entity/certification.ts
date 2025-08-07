// src/entity/certification.ts
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
import { ExamType } from "@/type/enum/exam";

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
    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({ length: 255, nullable: true, type: "varchar" })
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

    @Column({ length: 255, nullable: true, type: "varchar" })
    modifiedBy?: string;

    @Column({ length: 200, nullable: true, type: "varchar" })
    name?: string;

    @JoinColumn({ name: "studentId" })
    @ManyToOne(() => StudentEntity, (student) => student.certifications, {
        onDelete: "CASCADE",
    })
    student!: StudentEntity;

    @Column({ type: "uuid" })
    studentId!: string;

    constructor(certification?: Partial<CertificationEntity>) {
        if (certification) {
            Object.assign(this, certification);
        }
    }
}
