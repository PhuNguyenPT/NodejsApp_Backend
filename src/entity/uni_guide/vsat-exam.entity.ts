import {
    Column,
    CreateDateColumn,
    type DeepPartial,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
    UpdateDateColumn,
} from "typeorm";

import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import {
    type VsatExamSubject,
    VsatExamSubjects,
} from "@/type/enum/vsat-exam-subject.js";

@Entity({ name: "vsat_exams", schema: "uni_guide" })
export class VsatExamEntity {
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

    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string;

    @Column({ enum: VsatExamSubjects, name: "name", type: "varchar" })
    name!: VsatExamSubject;

    @Column({
        name: "score",
        transformer: {
            from: (value: string) => parseFloat(value),
            to: (value: number) => value,
        },
        type: "numeric",
    })
    score!: number;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "vsatExams", {
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

    constructor(entityLike?: DeepPartial<VsatExamEntity>) {
        Object.assign(this, entityLike);
    }
}
