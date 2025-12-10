import {
    Column,
    CreateDateColumn,
    type DeepPartial,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
    UpdateDateColumn,
} from "typeorm";

import { MajorGroupEntity } from "@/entity/uni_guide/major-group.entity.js";

/**
 * Represents a specific Major (e.g., "71401: Khoa học giáo dục").
 * This entity holds the detailed major information and links back to its group.
 */
@Entity({ name: "majors", schema: "uni_guide" })
export class MajorEntity {
    @Column({
        length: 255,
        name: "code",
        nullable: false,
        type: "varchar",
        unique: true,
    })
    code!: string; // The full major code, e.g., "71401"

    @CreateDateColumn({
        insert: true,
        name: "created_at",
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @JoinColumn({ name: "group_id" })
    @ManyToOne("MajorGroupEntity", "majors", {
        nullable: false,
        onDelete: "CASCADE",
    })
    group!: Relation<MajorGroupEntity>;

    @Column({ name: "group_id", nullable: false, type: "uuid" })
    group_id!: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "name", nullable: false, type: "varchar" })
    name!: string; // The Vietnamese name of the major, e.g., "Khoa học giáo dục"

    @UpdateDateColumn({
        insert: false,
        name: "updated_at",
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;

    constructor(entityLike?: DeepPartial<MajorEntity>) {
        Object.assign(this, entityLike);
    }
}
