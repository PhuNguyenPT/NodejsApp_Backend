// src/entity/award.ts
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

import { StudentEntity } from "@/entity/student.entity.js";
import {
    NationalExcellentExamType,
    NationalExcellentStudentExamSubject,
} from "@/type/enum/national-excellent-exam.js";
import { Rank } from "@/type/enum/rank.js";

@Entity({ name: "awards" })
@Index("idx_award_student_id", ["studentId"])
@Index("idx_award_category", ["category"])
@Index("idx_award_level", ["level"])
@Index("idx_award_created_at", ["createdAt"])
@Index("idx_award_updated_at", ["updatedAt"])
export class AwardEntity {
    @Column({
        enum: NationalExcellentStudentExamSubject,
        nullable: true,
        type: "enum",
    })
    category?: NationalExcellentStudentExamSubject;

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

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ enum: Rank, nullable: true, type: "enum" })
    level?: Rank;

    @Column({ enum: NationalExcellentExamType, nullable: true, type: "enum" })
    name?: NationalExcellentExamType;

    @JoinColumn({ name: "studentId" })
    @ManyToOne("StudentEntity", "awards", {
        onDelete: "CASCADE",
    })
    student!: Relation<StudentEntity>;

    @Column({ type: "uuid" })
    studentId!: string;

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

    constructor(award?: Partial<AwardEntity>) {
        if (award) {
            Object.assign(this, award);
        }
    }
}
