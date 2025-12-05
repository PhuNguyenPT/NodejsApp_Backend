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

import { TranscriptSubject } from "@/type/enum/transcript-subject.js";

import { TranscriptEntity } from "./transcript.entity.js";

@Entity({ name: "transcript_subjects", schema: "uni_guide" })
export class TranscriptSubjectEntity {
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

    @Column({ name: "score", nullable: false, type: "numeric" })
    score!: number;

    @Column({
        enum: TranscriptSubject,
        name: "subject",
        nullable: false,
        type: "enum",
    })
    subject!: TranscriptSubject;

    @JoinColumn({ name: "transcript_id" })
    @ManyToOne("TranscriptEntity", "transcriptSubjects", {
        onDelete: "CASCADE",
        orphanedRowAction: "delete",
    })
    transcript!: Relation<TranscriptEntity>;

    @Column({ name: "transcript_id", type: "uuid" })
    transcriptId!: string;

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

    constructor(entityLike?: DeepPartial<TranscriptSubjectEntity>) {
        Object.assign(this, entityLike);
    }
}
