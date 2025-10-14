import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "l2_uni_requirement", schema: "machine_learning" })
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

    @Column({ name: "y_base", nullable: true, type: "numeric" })
    yBase!: number;
}
