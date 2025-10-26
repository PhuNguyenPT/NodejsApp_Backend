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
    admissionCode!: null | string;

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
            from: (value: null | string) => {
                if (value === null) return null;
                return value;
            },
            to: (value: null | number[] | string) => {
                if (value === null) return null;
                if (typeof value === "string") return value;
                return `[${value.join(",")}]`;
            },
        },
        type: "text",
    })
    tfidfContent!: null | string;

    @Column({ name: "tuition_fee", nullable: true, type: "numeric" })
    tuitionFee!: null | number;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;
}
