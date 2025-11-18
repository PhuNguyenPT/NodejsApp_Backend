import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "transcript_subject_group", schema: "machine_learning" })
@Index("idx_tsg_major_code", ["majorCode"])
@Index("idx_tsg_uni_code", ["uniCode"])
@Index("idx_tsg_subject_combination", ["subjectCombination"])
@Index("idx_tsg_created_at", ["createdAt"])
@Index("idx_tsg_updated_at", ["updatedAt"])
export class TranscriptSubjectGroupEntity {
    @CreateDateColumn({
        insert: true,
        name: "created_at",
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "major_code", nullable: true, type: "varchar" })
    majorCode?: null | string;

    @Column({ name: "subject_combination", nullable: true, type: "varchar" })
    subjectCombination?: null | string;

    @Column({ name: "uni_code", nullable: true, type: "varchar" })
    uniCode?: null | string;

    @UpdateDateColumn({
        insert: false,
        name: "updated_at",
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;
}
