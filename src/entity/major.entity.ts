import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
} from "typeorm";

import { MajorGroupEntity } from "@/entity/major.group.entity.js";

/**
 * Represents a specific Major (e.g., "71401: Khoa học giáo dục").
 * This entity holds the detailed major information and links back to its group.
 */
@Entity("majors")
export class MajorEntity {
    @Column({ length: 255, nullable: false, type: "varchar", unique: true })
    code!: string; // The full major code, e.g., "71401"

    @JoinColumn({ name: "group_id" })
    @ManyToOne("MajorGroupEntity", "majors", {
        nullable: false,
        onDelete: "CASCADE",
    })
    group!: Relation<MajorGroupEntity>;

    @Column({ nullable: false, type: "uuid" })
    group_id!: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ nullable: false, type: "varchar" })
    name!: string; // The Vietnamese name of the major, e.g., "Khoa học giáo dục"

    constructor(major?: Partial<MajorEntity>) {
        if (major) {
            Object.assign(this, major);
        }
    }
}
