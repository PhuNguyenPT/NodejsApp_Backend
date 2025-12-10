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
import { AcademicPerformance } from "@/type/enum/academic-performance.js";

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

    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string;

    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "academicPerformances", {
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

    constructor(entityLike?: DeepPartial<AcademicPerformanceEntity>) {
        Object.assign(this, entityLike);
    }
}
