import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "l3_transcript", schema: "machine_learning" })
@Index("idx_l3_major_code", ["majorCode"])
@Index("idx_l3_major_group", ["majorGroup"])
@Index("idx_l3_major_name", ["majorName"])
@Index("idx_l3_province", ["province"])
@Index("idx_l3_score", ["score"])
@Index("idx_l3_tuition_fee", ["tuitionFee"])
@Index("idx_l3_uni_code", ["uniCode"])
@Index("idx_l3_uni_type", ["uniType"])
@Index("idx_l3_created_at", ["createdAt"])
@Index("idx_l3_updated_at", ["updatedAt"])
export class L3Entity {
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

    @Column({ name: "major_group", nullable: true, type: "integer" })
    majorGroup?: null | number;

    @Column({ name: "major_name", nullable: true, type: "varchar" })
    majorName?: null | string;

    @Column({ name: "province", nullable: true, type: "varchar" })
    province?: null | string;

    @Column({ name: "score", nullable: true, type: "numeric" })
    score?: null | number;

    @Column({ name: "tuition_fee", nullable: true, type: "numeric" })
    tuitionFee?: null | number;

    @Column({ name: "uni_code", nullable: true, type: "varchar" })
    uniCode?: null | string;

    @Column({ name: "uni_type", nullable: true, type: "smallint" })
    uniType?: null | number;

    @UpdateDateColumn({
        insert: false,
        name: "updated_at",
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;
}
