// src/repository/user.repository.interface.ts
import { User } from "@/dto/user/user";
import UserEntity from "@/entity/user.js";

export interface IUserRepository {
    createUser(user: Partial<User>): UserEntity;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
    existsByEmail(email: string): Promise<boolean>;
    findAll(): Promise<UserEntity[]>;
    findByEmail(email: string): Promise<UserEntity>;
    findById(id: string): Promise<null | UserEntity>;
    findByIdAndName(id: string, name?: string): Promise<null | UserEntity>;
    saveUser(userEntity: UserEntity): Promise<UserEntity>;
    update(id: string, updateData: Partial<UserEntity>): Promise<UserEntity>;
}
