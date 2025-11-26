import { Expose, Transform } from "class-transformer";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import {
    TalentExamSubject,
    TalentExamSubjects,
} from "@/type/enum/talent-exam-subject.js";

import { StudentEntity } from "./student.entity.js";

@Entity({ name: "talent_exams", schema: "uni_guide" })
export class TalentExamEntity {
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

    @Expose()
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string;

    @Column({ enum: TalentExamSubjects, name: "name", type: "varchar" })
    @Expose()
    name!: TalentExamSubject;

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
    @ManyToOne("StudentEntity", "talentExams", {
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
}
