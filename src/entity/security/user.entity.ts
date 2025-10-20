// src/entity/user.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";

import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { Permission, Role } from "@/type/enum/user.js";

@Entity({ name: "users", schema: "security" })
@Index("idx_user_id_name", ["id", "name"])
@Index("idx_user_email", ["email"])
@Index("idx_user_role", ["role"]) // Add index for role queries
@Index("idx_user_account_status", [
    "enabled",
    "credentialsNonExpired",
    "accountNonExpired",
    "accountNonLocked",
])
@Index("idx_user_created_at", ["createdAt"])
@Index("idx_user_updated_at", ["updatedAt"])
@Index("idx_user_permissions", ["permissions"])
@Index("idx_user_phone_numbers", ["phoneNumbers"])
export class UserEntity {
    @Column({ default: true, type: "boolean" })
    accountNonExpired = true;

    @Column({ default: true, type: "boolean" })
    accountNonLocked = true;

    @CreateDateColumn({
        insert: true,
        type: "timestamp with time zone",
        update: false,
    })
    createdAt!: Date;

    @Column({
        default: Role.ANONYMOUS,
        insert: true,
        length: 255,
        nullable: true,
        type: "varchar",
        update: false,
    })
    createdBy?: string;

    @Column({ default: true, type: "boolean" })
    credentialsNonExpired = true;

    @Column({ length: 255, type: "varchar", unique: true })
    email!: string;

    @Column({ default: true, type: "boolean" })
    enabled = true;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ length: 255, nullable: true, type: "varchar" })
    name?: string;

    @Column({ length: 128, type: "varchar" })
    password!: string;

    // Store permissions as an array of strings
    @Column({ nullable: true, type: "jsonb" })
    permissions!: Permission[];

    @Column({ nullable: true, type: "jsonb" })
    phoneNumbers?: string[];

    @Column({
        default: Role.USER,
        enum: Role,
        type: "enum",
    })
    role!: Role;

    @OneToMany("StudentEntity", "user", {
        eager: false,
    })
    studentEntities?: Relation<StudentEntity[]>;

    @UpdateDateColumn({
        insert: false,
        type: "timestamp with time zone",
        update: true,
    })
    updatedAt!: Date;

    @Column({
        insert: false,
        length: 255,
        nullable: true,
        type: "varchar",
        update: true,
    })
    updatedBy?: string;

    constructor(user?: Partial<UserEntity>) {
        if (user) {
            Object.assign(this, user);
        }
    }

    disableAccount(): void {
        this.enabled = false;
    }

    enableAccount(): void {
        this.enabled = true;
    }

    expireAccount(): void {
        this.accountNonExpired = false;
    }

    expireCredentials(): void {
        this.credentialsNonExpired = false;
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

    // Helper method to check if account is fully active
    isAccountActive(): boolean {
        return (
            this.accountNonExpired &&
            this.accountNonLocked &&
            this.credentialsNonExpired &&
            this.enabled
        );
    }

    isAccountNonExpired(): boolean {
        return this.accountNonExpired;
    }

    isAccountNonLocked(): boolean {
        return this.accountNonLocked;
    }

    isCredentialsNonExpired(): boolean {
        return this.credentialsNonExpired;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    // Helper methods for account management
    lockAccount(): void {
        this.accountNonLocked = false;
    }

    unlockAccount(): void {
        this.accountNonLocked = true;
    }
}
