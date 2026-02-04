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
import { AcademicPerformance } from "@/type/enum/academic-performance.enum.js";

@Entity({ name: "academic_performances", schema: "uni_guide" })
export class AcademicPerformanceEntity {
    @Column({
        enum: AcademicPerformance,
        name: "academic_performance",
        type: "enum",
    })
    academicPerformance!: AcademicPerformance;

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

    @Column({ name: "grade", type: "int" })
    grade!: number;

    @PrimaryColumn({
        default: () => "uuidv7()",
        name: "id",
        nullable: false,
        type: "uuid",
    })
    id!: UUID;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "academicPerformances", {
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

    constructor(entityLike?: DeepPartial<AcademicPerformanceEntity>) {
        Object.assign(this, entityLike);
    }
}
