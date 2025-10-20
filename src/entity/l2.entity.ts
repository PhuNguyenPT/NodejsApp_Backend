import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "l2_uni_requirement", schema: "machine_learning" })
@Index("idx_l2_academic_performance_grade_10", [
    "academic_performance_grade_10",
])
@Index("idx_l2_academic_performance_grade_11", [
    "academic_performance_grade_11",
])
@Index("idx_l2_academic_performance_grade_12", [
    "academic_performance_grade_12",
])
@Index("idx_l2_admission_code", ["admissionCode"])
@Index("idx_l2_certification_name", ["certificationName"])
@Index("idx_l2_certification_score", ["certificationScore"])
@Index("idx_l2_certification_score_equivalence", [
    "certificationScoreEquivalence",
])
@Index("idx_l2_conduct_grade_10", ["conduct_grade_10"])
@Index("idx_l2_conduct_grade_11", ["conduct_grade_11"])
@Index("idx_l2_conduct_grade_12", ["conduct_grade_12"])
@Index("idx_l2_is_base_row", ["isBaseRow"])
@Index("idx_l2_major_code", ["majorCode"])
@Index("idx_l2_province", ["province"])
@Index("idx_l2_score", ["score"])
@Index("idx_l2_score_final", ["scoreFinal"])
@Index("idx_l2_subject_combination", ["subjectCombination"])
@Index("idx_l2_tuition_fee", ["tuitionFee"])
@Index("idx_l2_uni_type_label", ["uniTypeLabel"])
@Index("idx_l2_y_base", ["yBase"])
@Index("idx_l2_created_at", ["createdAt"])
@Index("idx_l2_updated_at", ["updatedAt"])
export class L2Entity {
    @Column({
        name: "academic_performance_grade_10",
        nullable: true,
        type: "integer",
    })
    academic_performance_grade_10!: number;

    @Column({
        name: "academic_performance_grade_11",
        nullable: true,
        type: "integer",
    })
    academic_performance_grade_11!: number;

    @Column({
        name: "academic_performance_grade_12",
        nullable: true,
        type: "integer",
    })
    academic_performance_grade_12!: number;

    @Column({ name: "admission_code", nullable: true, type: "varchar" })
    admissionCode!: string;

    @Column({ name: "certification_name", nullable: true, type: "integer" })
    certificationName!: number;

    @Column({ name: "certification_score", nullable: true, type: "integer" })
    certificationScore!: number;

    @Column({
        name: "certification_score_equivalence",
        nullable: true,
        type: "integer",
    })
    certificationScoreEquivalence!: number;

    @Column({ name: "conduct_grade_10", nullable: true, type: "integer" })
    conduct_grade_10!: number;

    @Column({ name: "conduct_grade_11", nullable: true, type: "integer" })
    conduct_grade_11!: number;

    @Column({ name: "conduct_grade_12", nullable: true, type: "integer" })
    conduct_grade_12!: number;

    @CreateDateColumn({
        insert: true,
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "is_base_row", nullable: true, type: "boolean" })
    isBaseRow!: boolean;

    @Column({ name: "major_code", nullable: true, type: "integer" })
    majorCode!: number;

    @Column({ name: "province", nullable: true, type: "varchar" })
    province!: string;

    @Column({ name: "score", nullable: true, type: "numeric" })
    score!: number;

    @Column({ name: "score_final", nullable: true, type: "numeric" })
    scoreFinal!: number;

    @Column({ name: "subject_combination", nullable: true, type: "varchar" })
    subjectCombination!: string;

    @Column({ name: "tuition_fee", nullable: true, type: "numeric" })
    tuitionFee!: number;

    @Column({ name: "uni_type_label", nullable: true, type: "smallint" })
    uniTypeLabel!: number;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;

    @Column({ name: "y_base", nullable: true, type: "numeric" })
    yBase!: number;
}
