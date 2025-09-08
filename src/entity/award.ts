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

import { StudentEntity } from "@/entity/student.js";
import { ExamType } from "@/type/enum/exam.js";
import { NationalExcellentStudentExamSubject } from "@/type/enum/national.excellent.student.subject.js";
import { Rank } from "@/type/enum/rank.js";

@Entity({ name: "awards" })
@Index("idx_award_student_id", ["studentId"])
@Index("idx_award_date", ["awardDate"])
@Index("idx_award_category", ["category"])
@Index("idx_award_level", ["level"])
@Index("idx_award_created_at", ["createdAt"])
@Index("idx_award_modified_at", ["modifiedAt"])
export class AwardEntity {
    @Column({ nullable: true, type: "date" })
    awardDate?: Date;

    @Column({ length: 100, nullable: true, type: "varchar" })
    awardId?: string;

    @Column({ length: 200, nullable: true, type: "varchar" })
    awardingOrganization?: string;

    @Column({
        enum: NationalExcellentStudentExamSubject,
        nullable: true,
        type: "enum",
    })
    category?: NationalExcellentStudentExamSubject;

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

    @Column({ nullable: true, type: "text" })
    description?: string;

    @Column({ nullable: true, type: "jsonb" })
    examType!: ExamType;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ enum: Rank, nullable: true, type: "enum" })
    level?: Rank;

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
    @ManyToOne("StudentEntity", "awards", {
        onDelete: "CASCADE",
    })
    student!: Relation<StudentEntity>;

    @Column({ type: "uuid" })
    studentId!: string;

    constructor(award?: Partial<AwardEntity>) {
        if (award) {
            Object.assign(this, award);
        }
    }
}
