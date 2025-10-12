import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { MajorEntity } from "@/entity/major.entity.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { MajorGroup, MajorGroupKey } from "@/type/enum/major.js";

/**
 * Represents a Major Group (e.g., "714: Khoa học giáo dục và đào tạo giáo viên").
 * This entity holds the top-level categories for majors.
 */
@Entity("major_groups")
@Index("idx_major_groups_code", ["code"])
@Index("idx_major_groups_created_at", ["createdAt"])
@Index("idx_major_groups_english_name", ["englishName"])
@Index("idx_major_groups_id", ["id"])
@Index("idx_major_groups_name", ["name"])
@Index("idx_major_groups_updated_at", ["updatedAt"])
export class MajorGroupEntity {
    @Column({ length: "255", type: "varchar", unique: true })
    code!: string; // The 3-digit code, e.g., "714"

    @CreateDateColumn({
        insert: true,
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @Column({
        length: 255,
        name: "english_name",
        type: "varchar",
    })
    englishName!: MajorGroupKey; // The English enum key for programmatic access

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // A MajorGroup has many Majors. This defines the inverse side of the relationship.
    @OneToMany("MajorEntity", "group")
    majors!: Relation<MajorEntity[]>;

    @Column({ enum: MajorGroup, nullable: false, type: "enum" })
    name!: MajorGroup; // The Vietnamese name, e.g., "Khoa học giáo dục và đào tạo giáo viên"

    @ManyToMany("StudentEntity", "majorGroupsEntities")
    students?: Relation<StudentEntity[]>;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;
    constructor(majorGroup?: Partial<MajorGroupEntity>) {
        if (majorGroup) {
            Object.assign(this, majorGroup);
        }
    }
}
