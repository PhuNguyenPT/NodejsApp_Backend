import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { L1PredictResult, L2PredictResult } from "@/dto/predict/predict.js";
import { StudentEntity } from "@/entity/student.entity.js";

export enum PredictionResultStatus {
    COMPLETED = "completed",
    FAILED = "failed",
    PARTIAL = "partial",
    PROCESSING = "processing",
}

@Entity("prediction_results")
@Index("idx_prediction_results_created_at", ["createdAt"])
@Index("idx_prediction_results_created_by", ["createdBy"])
@Index("idx_prediction_results_status", ["status"])
@Index("idx_prediction_results_student_id", ["studentId"])
@Index("idx_prediction_results_updated_at", ["updatedAt"])
@Index("idx_prediction_results_updated_by", ["updatedBy"])
export class PredictionResultEntity {
    @CreateDateColumn({
        insert: true,
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @Column({ insert: true, nullable: true, type: "varchar", update: false })
    createdBy!: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ nullable: true, type: "jsonb" })
    l1PredictResults!: L1PredictResult[];

    @Column({ nullable: true, type: "jsonb" })
    l2PredictResults!: L2PredictResult[];

    @Column({
        enum: PredictionResultStatus,
        type: "enum",
    })
    status!: PredictionResultStatus;

    @JoinColumn({ name: "studentId" })
    @OneToOne("StudentEntity", "predictionResult", {
        onDelete: "CASCADE",
    })
    student!: Relation<StudentEntity>;

    @Column({ type: "uuid" })
    studentId!: string;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;

    @Column({ insert: false, nullable: true, type: "varchar", update: true })
    updatedBy!: string;

    @Column({ nullable: true, type: "uuid" })
    userId?: string;
}
