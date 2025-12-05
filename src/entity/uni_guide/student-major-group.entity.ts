// src/entity/uni_guide/student-major-group.entity.ts
import { Expose } from "class-transformer";
import {
    Column,
    CreateDateColumn,
    DeepPartial,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
    Unique,
    UpdateDateColumn,
} from "typeorm";

import { MajorGroupEntity } from "./major-group.entity.js";
import { StudentEntity } from "./student.entity.js";

@Entity({ name: "student_major_groups", schema: "uni_guide" })
@Index("idx_student_major_groups_student_id", ["studentId"])
@Index("idx_student_major_groups_major_group_id", ["majorGroupId"])
@Unique("uq_student_major_groups", ["studentId", "majorGroupId"])
export class StudentMajorGroupEntity {
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

    @Expose()
    @JoinColumn({ name: "major_group_id" })
    @ManyToOne("MajorGroupEntity", "studentMajorGroups", {
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    majorGroup!: Relation<MajorGroupEntity>;

    @Column({ name: "major_group_id", type: "uuid" })
    @Expose()
    majorGroupId!: string;

    @Expose()
    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "studentMajorGroups", {
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

    constructor(entityLike?: DeepPartial<StudentMajorGroupEntity>) {
        Object.assign(this, entityLike);
    }
}
