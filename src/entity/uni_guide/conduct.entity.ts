import {
    Column,
    CreateDateColumn,
    DeepPartial,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { Conduct } from "@/type/enum/conduct.js";

@Entity({ name: "conducts", schema: "uni_guide" })
export class ConductEntity {
    @Column({ enum: Conduct, name: "conduct", type: "enum" })
    conduct!: Conduct;

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
    @ManyToOne("StudentEntity", "conducts", {
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

    constructor(entityLike?: DeepPartial<ConductEntity>) {
        Object.assign(this, entityLike);
    }
}
