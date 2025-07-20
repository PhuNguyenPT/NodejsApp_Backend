// src/entity/user.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "users" })
// This composite index will be used for your findByIdAndName query - FASTEST for your specific case
@Index("idx_user_id_name", ["id", "name"])
export class UserEntity {
    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({ nullable: true, type: "varchar" })
    createdBy!: string;

    @Column({ length: 255, type: "varchar", unique: true })
    email!: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    modifiedAt!: Date;

    @Column({ nullable: true, type: "varchar" })
    modifiedBy!: string;

    @Column({ length: 255, type: "varchar" })
    name!: string;

    @Column({ nullable: true, type: "simple-array" })
    phoneNumbers!: string[];

    @Column({ default: "Happy", length: 50, type: "varchar" })
    status!: string;

    constructor(user?: Partial<UserEntity>) {
        if (user) {
            Object.assign(this, user);
        }
    }
}

export default UserEntity;
