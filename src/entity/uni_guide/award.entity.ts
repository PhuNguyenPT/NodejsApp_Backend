// src/entity/award.ts
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

import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import {
    NationalExcellentExamType,
    NationalExcellentStudentExamSubject,
} from "@/type/enum/national-excellent-exam.js";
import { Rank } from "@/type/enum/rank.js";

@Entity({ name: "awards", schema: "uni_guide" })
@Index("idx_award_student_id", ["studentId"])
@Index("idx_award_category", ["category"])
@Index("idx_award_level", ["level"])
@Index("idx_award_created_at", ["createdAt"])
@Index("idx_award_updated_at", ["updatedAt"])
export class AwardEntity {
    @Column({
        enum: NationalExcellentStudentExamSubject,
        name: "category",
        nullable: true,
        type: "enum",
    })
    category?: NationalExcellentStudentExamSubject;

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

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        enum: Rank,
        name: "level",
        nullable: true,
        type: "enum",
    })
    level?: Rank;

    @Column({
        enum: NationalExcellentExamType,
        name: "name",
        nullable: true,
        type: "enum",
    })
    name?: NationalExcellentExamType;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "awards", {
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

    constructor(entityLike?: DeepPartial<AwardEntity>) {
        Object.assign(this, entityLike);
    }
}
