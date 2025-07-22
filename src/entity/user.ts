// src/entity/user.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { UserStatus } from "@/type/enum/user.status.js";

@Entity({ name: "users" })
// This composite index will be used for your findByIdAndName query - FASTEST for your specific case
@Index("idx_user_id_name", ["id", "name"])
// Additional useful indexes
@Index("idx_user_email", ["email"]) // Already unique, but explicit index for faster lookups
@Index("idx_user_status", ["status"]) // If you frequently filter by status
export class UserEntity {
    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({ length: 255, nullable: true, type: "varchar" })
    createdBy?: string;

    @Column({ length: 255, type: "varchar", unique: true })
    email!: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    modifiedAt!: Date;

    @Column({ length: 255, nullable: true, type: "varchar" })
    modifiedBy?: string;

    @Column({ length: 255, nullable: true, type: "varchar" })
    name?: string;

    @Column({ length: 128, type: "varchar" })
    password!: string;

    @Column("simple-array", { nullable: true })
    phoneNumbers?: string[];

    @Column({
        default: UserStatus.HAPPY,
        enum: UserStatus,
        type: "enum",
    })
    status!: UserStatus;

    constructor(user?: Partial<UserEntity>) {
        if (user) {
            Object.assign(this, user);
        }
    }
}

export default UserEntity;
