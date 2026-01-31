// src/entity/certification.ts
import {
    Column,
    CreateDateColumn,
    type DeepPartial,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
    UpdateDateColumn,
} from "typeorm";

import type { UUID } from "@/type/common/uuid.type.js";

import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import {
    type CCNNType,
    type CCQTType,
    CertificationExamTypeEnum,
} from "@/type/enum/exam-type.enum.js";

export enum CEFR {
    A1 = "A1",
    A2 = "A2",
    B1 = "B1",
    B2 = "B2",
    C1 = "C1",
    C2 = "C2",
}
@Entity({ name: "certifications", schema: "uni_guide" })
@Index("idx_certification_student_id", ["studentId"])
@Index("idx_certification_cefr", ["cefr"])
@Index("idx_certification_level", ["level"])
@Index("idx_certification_created_at", ["createdAt"])
@Index("idx_certification_updated_at", ["updatedAt"])
export class CertificationEntity {
    @Column({
        enum: CEFR,
        name: "cefr",
        nullable: true,
        type: "enum",
    })
    cefr?: CEFR;

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
        enum: CertificationExamTypeEnum,
        name: "exam_type",
        nullable: true,
        type: "enum",
    })
    examType?: CCNNType | CCQTType;

    @PrimaryGeneratedColumn("uuid")
    id!: UUID;

    @Column({ length: 50, name: "level", nullable: true, type: "varchar" })
    level?: string;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "certifications", {
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    student!: Relation<StudentEntity>;

    @Column({ name: "student_id", type: "uuid" })
    studentId!: UUID;

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

    constructor(entityLike?: DeepPartial<CertificationEntity>) {
        Object.assign(this, entityLike);
    }
}
