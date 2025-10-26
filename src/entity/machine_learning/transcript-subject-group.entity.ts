import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "transcript_subject_group", schema: "machine_learning" })
@Index("idx_tsg_major_code", ["major_code"])
@Index("idx_tsg_uni_code", ["uni_code"])
@Index("idx_tsg_subject_combination", ["subject_combination"])
@Index("idx_tsg_created_at", ["createdAt"])
@Index("idx_tsg_updated_at", ["updatedAt"])
export class TranscriptSubjectGroupEntity {
    @CreateDateColumn({
        insert: true,
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "major_code", nullable: true, type: "varchar" })
    major_code!: null | string;

    @Column({ name: "subject_combination", nullable: true, type: "varchar" })
    subject_combination!: null | string;

    @Column({ name: "uni_code", nullable: true, type: "varchar" })
    uni_code!: null | string;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;
}
