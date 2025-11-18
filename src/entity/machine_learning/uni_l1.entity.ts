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
    admissionCode?: null | string;

    @CreateDateColumn({
        insert: true,
        name: "created_at",
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        length: "65",
        name: "tfidf_content",
        nullable: true,
        transformer: {
            // From DB to application: string → number[]
            from: (value: null | string | undefined): null | number[] => {
                if (value == null) return null;
                // pgvector returns format like "[1,2,3]"
                if (typeof value === "string") {
                    // Remove brackets and parse
                    const cleaned = value.replace(/^\[|\]$/g, "");
                    if (!cleaned) return null;
                    return cleaned.split(",").map(Number);
                }
                return value as number[];
            },
            // From application to DB: number[] → string
            to: (value: null | number[] | undefined): null | string => {
                if (value == null) return null;
                // Convert array to pgvector format "[1,2,3]"
                if (Array.isArray(value)) {
                    return `[${value.join(",")}]`;
                }
                // If already formatted (shouldn't happen)
                return value as string;
            },
        },
        type: "vector",
    })
    tfidfContent?: null | number[];

    @Column({ name: "tuition_fee", nullable: true, type: "numeric" })
    tuitionFee?: null | number;

    @UpdateDateColumn({
        insert: false,
        name: "updated_at",
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;
}
