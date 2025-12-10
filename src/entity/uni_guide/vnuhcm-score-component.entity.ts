// vnuhcm-score-component.entity.ts
import {
    Column,
    CreateDateColumn,
    DeepPartial,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { AptitudeExamEntity } from "@/entity/uni_guide/aptitude-exam.entity.js";

@Entity({ name: "vnuhcm_score_components", schema: "uni_guide" })
export class VnuhcmScoreComponentEntity {
    @JoinColumn({ name: "aptitude_exam_id" })
    @OneToOne("AptitudeExamEntity", "vnuhcmPartialScores", {
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    aptitudeExam!: Relation<AptitudeExamEntity>;

    @Column({ name: "aptitude_exam_id", type: "uuid" })
    aptitudeExamId!: string;

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

    /**
     * Language score component (0-400)
     */
    @Column({ name: "language_score", type: "integer" })
    languageScore!: number;

    /**
     * Math score component (0-300)
     */
    @Column({ name: "math_score", type: "integer" })
    mathScore!: number;

    /**
     * Science & Logic score component (0-500)
     */
    @Column({ name: "science_logic", type: "integer" })
    scienceLogic!: number;

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

    constructor(entityLike?: DeepPartial<VnuhcmScoreComponentEntity>) {
        Object.assign(this, entityLike);
    }
}
