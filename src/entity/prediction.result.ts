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

import { L1PredictResult, L2PredictResult } from "@/dto/predict/predict.js";
import { StudentEntity } from "@/entity/student.js";

export enum PredictionResultStatus {
    COMPLETED = "completed",
    FAILED = "failed",
    PARTIAL = "partial",
    PROCESSING = "processing",
}

@Entity("prediction_result")
export class PredictionResultEntity {
    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({ nullable: true, type: "varchar" })
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

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updatedAt!: Date;

    @Column({ nullable: true, type: "uuid" })
    userId?: string;
}
