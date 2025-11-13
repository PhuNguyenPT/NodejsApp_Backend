// vnuhcm-score-component.entity.ts
import { Expose } from "class-transformer";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { StudentAptitudeExamEntity } from "./student-aptitude-exam.entity.js";

@Entity({ name: "vnuhcm_score_components", schema: "uni_guide" })
export class VnuhcmScoreComponentEntity {
    @Expose()
    @JoinColumn({ name: "aptitude_exam_id" })
    @OneToOne("StudentAptitudeExamEntity", "vnuhcmPartialScores", {
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    aptitudeExam!: Relation<StudentAptitudeExamEntity>;

    @Column({ name: "aptitude_exam_id", type: "uuid" })
    @Expose()
    aptitudeExamId!: string;

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

    /**
     * Language score component (0-400)
     */
    @Column({ name: "language_score", type: "int" })
    @Expose()
    languageScore!: number;

    /**
     * Math score component (0-300)
     */
    @Column({ name: "math_score", type: "int" })
    @Expose()
    mathScore!: number;

    /**
     * Science & Logic score component (0-500)
     */
    @Column({ name: "science_logic", type: "int" })
    @Expose()
    scienceLogic!: number;

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
