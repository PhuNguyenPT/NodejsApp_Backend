// src/entity/user.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { StudentEntity } from "@/entity/student.js";
import { Permission, Role, UserStatus } from "@/type/enum/user.js";

@Entity({ name: "users" })
@Index("idx_user_id_name", ["id", "name"])
@Index("idx_user_email", ["email"])
@Index("idx_user_status", ["status"])
@Index("idx_user_role", ["role"]) // Add index for role queries
@Index("idx_user_account_status", [
    "enabled",
    "credentialsNonExpired",
    "accountNonExpired",
    "accountNonLocked",
])
@Index("idx_user_created_at", ["createdAt"])
@Index("idx_user_modified_at", ["modifiedAt"])
@Index("idx_user_permissions", ["permissions"])
@Index("idx_user_phone_numbers", ["phoneNumbers"])
export class UserEntity {
    @Column({ default: true, type: "boolean" })
    accountNonExpired = true;

    @Column({ default: true, type: "boolean" })
    accountNonLocked = true;

    @CreateDateColumn({ type: "timestamp with time zone" })
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

    @UpdateDateColumn({ type: "timestamp with time zone" })
    modifiedAt!: Date;

    @Column({
        insert: false,
        length: 255,
        nullable: true,
        type: "varchar",
        update: true,
    })
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

    @OneToMany(() => StudentEntity, (student) => student.user, {
        eager: false,
    })
    studentEntities?: StudentEntity[];

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
