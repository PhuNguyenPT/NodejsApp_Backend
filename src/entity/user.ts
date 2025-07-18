// src/entity/user.ts
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "users" })
export class UserEntity {
  @Column({ length: 255, type: "varchar", unique: true })
  email!: string;

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 255, type: "varchar" })
  name!: string;

  @Column({ nullable: true, type: "simple-array" })
  phoneNumbers!: string[]; // Changed from optional to required (matches interface)

  @Column({ default: "Happy", length: 50, type: "varchar" }) // Added default value
  status!: string;

  constructor(user?: Partial<UserEntity>) {
    if (user) {
      Object.assign(this, user);
    }
  }
}
export default UserEntity;
