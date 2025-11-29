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

import { L1PredictResult } from "@/dto/prediction/l1-response.dto.js";
import { L2PredictResult } from "@/dto/prediction/l2-response.dto.js";
import { L3PredictResult } from "@/dto/prediction/l3-predict-result.dto.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";

export enum PredictionResultStatus {
    COMPLETED = "completed",
    FAILED = "failed",
    PARTIAL = "partial",
    PROCESSING = "processing",
}

@Entity({ name: "prediction_results", schema: "uni_guide" })
@Index("idx_prediction_results_created_at", ["createdAt"])
@Index("idx_prediction_results_created_by", ["createdBy"])
@Index("idx_prediction_results_status", ["status"])
@Index("idx_prediction_results_student_id", ["studentId"])
@Index("idx_prediction_results_updated_at", ["updatedAt"])
@Index("idx_prediction_results_updated_by", ["updatedBy"])
export class PredictionResultEntity {
    @CreateDateColumn({
        insert: true,
        name: "created_at",
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @Column({
        insert: true,
        name: "created_by",
        nullable: true,
        type: "varchar",
        update: false,
    })
    createdBy!: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "l1_predict_results", nullable: true, type: "jsonb" })
    l1PredictResults!: L1PredictResult[];

    @Column({ name: "l2_predict_results", nullable: true, type: "jsonb" })
    l2PredictResults!: L2PredictResult[];

    @Column({ name: "l3_predict_results", nullable: true, type: "jsonb" })
    l3PredictResults!: L3PredictResult[];

    @Column({
        enum: PredictionResultStatus,
        name: "status",
        type: "enum",
    })
    status!: PredictionResultStatus;

    @JoinColumn({ name: "student_id" })
    @OneToOne("StudentEntity", "predictionResult", {
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
        name: "updated_by",
        nullable: true,
        type: "varchar",
        update: true,
    })
    updatedBy!: string;
}
