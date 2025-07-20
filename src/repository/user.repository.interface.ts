// src/repository/user.repository.interface.ts
import { CreateUserDto } from "@/dto/user/create.user.js";
import UserEntity from "@/entity/user.js";

export interface IUserRepository {
  create(createUserDto: CreateUserDto): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  findAll(): Promise<UserEntity[]>;
  findById(id: string): Promise<null | UserEntity>;
  findByIdAndName(id: string, name?: string): Promise<null | UserEntity>;
  update(id: string, updateData: Partial<UserEntity>): Promise<UserEntity>;
}
