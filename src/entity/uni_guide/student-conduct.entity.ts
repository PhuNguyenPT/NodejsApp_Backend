import { Expose } from "class-transformer";
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

import { Conduct } from "@/type/enum/conduct.js";

import { StudentEntity } from "./student.entity.js";

@Entity({ name: "student_conducts", schema: "uni_guide" })
export class StudentConductEntity {
    @Column({ enum: Conduct, name: "conduct", type: "enum" })
    @Expose()
    conduct!: Conduct;

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

    @Column({ name: "grade", type: "int" })
    @Expose()
    grade!: number;

    @Expose()
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string;

    @Expose()
    @JoinColumn({ name: "student_id" })
    @ManyToOne("StudentEntity", "conducts", {
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
