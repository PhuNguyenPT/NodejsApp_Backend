// src/entity/award.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { StudentEntity } from "@/entity/student.js";

@Entity({ name: "awards" })
@Index("idx_award_student_id", ["studentId"])
@Index("idx_award_date", ["awardDate"])
@Index("idx_award_category", ["category"])
export class AwardEntity {
    @Column({ type: "date" })
    awardDate!: Date;

    @Column({ length: 100, nullable: true, type: "varchar" })
    awardId?: string;

    @Column({ length: 200, nullable: true, type: "varchar" })
    awardingOrganization?: string;

    @Column({ length: 100, type: "varchar" })
    category!: string;

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({ length: 255, nullable: true, type: "varchar" })
    createdBy?: string;

    @Column({ nullable: true, type: "text" })
    description?: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 50, type: "varchar" })
    level!: string;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    modifiedAt!: Date;

    @Column({ length: 255, nullable: true, type: "varchar" })
    modifiedBy?: string;

    @Column({ length: 200, type: "varchar" })
    name!: string;

    @JoinColumn({ name: "studentId" })
    @ManyToOne(() => StudentEntity, (student) => student.awards, {
        onDelete: "CASCADE",
    })
    student!: StudentEntity;

    @Column({ type: "uuid" })
    studentId!: string;

    constructor(award?: Partial<AwardEntity>) {
        if (award) {
            Object.assign(this, award);
        }
    }
}
