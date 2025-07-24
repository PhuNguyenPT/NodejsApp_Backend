// src/entity/user.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { Permission, Role, UserStatus } from "@/type/enum/user.js";

@Entity({ name: "users" })
@Index("idx_user_id_name", ["id", "name"])
@Index("idx_user_email", ["email"])
@Index("idx_user_status", ["status"])
@Index("idx_user_role", ["role"]) // Add index for role queries
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

    // Store permissions as an array of strings
    @Column("simple-array", { nullable: true })
    permissions!: Permission[];

    @Column("simple-array", { nullable: true })
    phoneNumbers?: string[];

    @Column({
        default: Role.USER,
        enum: Role,
        type: "enum",
    })
    role!: Role;

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

    getPermissions(): Permission[] {
        return this.permissions;
    }

    // Helper method to check if user has all specified permissions
    hasAllPermissions(permissions: Permission[]): boolean {
        if (this.permissions.length <= 0) return false;
        return permissions.every((permission) =>
            this.permissions.includes(permission),
        );
    }

    // Helper method to check if user has any of the specified permissions
    hasAnyPermission(permissions: Permission[]): boolean {
        if (this.permissions.length <= 0) return false;
        return permissions.some((permission) =>
            this.permissions.includes(permission),
        );
    }

    // Helper method to check if user has a specific permission
    hasPermission(permission: Permission): boolean {
        return this.permissions.includes(permission);
    }
}
