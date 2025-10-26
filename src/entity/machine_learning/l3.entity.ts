import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "l3_transcript", schema: "machine_learning" })
@Index("idx_l3_major_code", ["major_code"])
@Index("idx_l3_major_group", ["major_group"])
@Index("idx_l3_major_name", ["major_name"])
@Index("idx_l3_province", ["province"])
@Index("idx_l3_score", ["score"])
@Index("idx_l3_tuition_fee", ["tuition_fee"])
@Index("idx_l3_uni_code", ["uni_code"])
@Index("idx_l3_uni_type", ["uni_type"])
@Index("idx_l3_created_at", ["createdAt"])
@Index("idx_l3_updated_at", ["updatedAt"])
export class L3Entity {
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

    @Column({ name: "major_group", nullable: true, type: "integer" })
    major_group!: null | number;

    @Column({ name: "major_name", nullable: true, type: "varchar" })
    major_name!: null | string;

    @Column({ name: "province", nullable: true, type: "varchar" })
    province!: null | string;

    @Column({ name: "score", nullable: true, type: "numeric" })
    score!: null | number;

    @Column({ name: "tuition_fee", nullable: true, type: "numeric" })
    tuition_fee!: null | number;

    @Column({ name: "uni_code", nullable: true, type: "varchar" })
    uni_code!: null | string;

    @Column({ name: "uni_type", nullable: true, type: "smallint" })
    uni_type!: null | number;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;
}
