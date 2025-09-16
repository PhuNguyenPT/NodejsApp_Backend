// src/entity/post.ts
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: "posts" })
export class PostEntity {
    @Column({ length: 255, type: "varchar" })
    body!: string;

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt!: Date;

    @Column({ nullable: true, type: "varchar" })
    createdBy!: string;

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    modifiedAt!: Date;

    @Column({ nullable: true, type: "varchar" })
    modifiedBy!: string;

    @Column({ length: 255, type: "varchar" })
    title!: string;

    constructor(user?: Partial<PostEntity>) {
        if (user) {
            Object.assign(this, user);
        }
    }
}

export default PostEntity;
