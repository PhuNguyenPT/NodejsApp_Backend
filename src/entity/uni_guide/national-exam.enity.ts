import {
    Column,
    CreateDateColumn,
    type DeepPartial,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    type Relation,
    UpdateDateColumn,
} from "typeorm";

import type { UUID } from "@/type/common/uuid.type.js";

import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import {
    type NationalExamSubject,
    NationalExamSubjects,
} from "@/type/enum/national-exam-subject.enum.js";

@Entity({ name: "national_exams", schema: "uni_guide" })
export class NationalExamEntity {
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

    @PrimaryColumn({
        default: () => "uuidv7()",
        name: "id",
        nullable: false,
        type: "uuid",
    })
    id!: UUID;

    @Column({ enum: NationalExamSubjects, name: "name", type: "varchar" })
    name!: NationalExamSubject;

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
    @ManyToOne("StudentEntity", "nationalExams", {
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

    constructor(entityLike?: DeepPartial<NationalExamEntity>) {
        Object.assign(this, entityLike);
    }
}
