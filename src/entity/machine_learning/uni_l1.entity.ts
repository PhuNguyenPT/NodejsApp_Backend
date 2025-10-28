import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "uni_l1", schema: "machine_learning" })
export class UniL1Entity {
    @Column({ name: "admission_code", nullable: true, type: "varchar" })
    admissionCode?: string;

    @CreateDateColumn({
        insert: true,
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        name: "tfidf_content",
        nullable: true,
        transformer: {
            from: (value: null | string | undefined) => value ?? null,
            to: (value: null | number[] | string | undefined) => {
                if (value == null) return null;
                if (typeof value === "string") return value;
                return `[${value.join(",")}]`;
            },
        },
        type: "text",
    })
    tfidfContent?: string;

    @Column({ name: "tuition_fee", nullable: true, type: "numeric" })
    tuitionFee?: number;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;
}
