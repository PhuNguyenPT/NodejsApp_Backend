// src/repository/impl/user.repository.ts
import { Repository } from "typeorm";

import { AppDataSource } from "@/config/data.source.js";
import { CreateUserDto } from "@/dto/user/create.user.js";
import UserEntity from "@/entity/user.js";
import { IUserRepository } from "@/repository/user.repository.interface.js";

export class UserRepository implements IUserRepository {
  private repository: Repository<UserEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserEntity);
  }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const userEntity = this.repository.create(createUserDto);
    return await this.repository.save(userEntity);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new Error(`User with id ${id} not found`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.repository.find();
  }

  async findById(id: string): Promise<null | UserEntity> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByIdAndName(id: string, name?: string): Promise<null | UserEntity> {
    const queryBuilder = this.repository.createQueryBuilder("user");

    queryBuilder.where("user.id = :id", { id });

    if (name) {
      queryBuilder.andWhere("user.name ILIKE :name", { name: `${name}%` });
    }

    return await queryBuilder.getOne();
  }

  async update(
    id: string,
    updateData: Partial<UserEntity>,
  ): Promise<UserEntity> {
    await this.repository.update(id, updateData);
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found after update`);
    }
    return updatedUser;
  }
}
