// src/repository/impl/user.repository.ts
import { Repository } from "typeorm";

import { AppDataSource } from "@/config/data.source.js";
import { User, UserAdmin } from "@/dto/user/user";
import { UserEntity } from "@/entity/user.js";
import { IUserRepository } from "@/repository/user.repository.interface.js";
import { EntityExistsException } from "@/type/exception/entity.exists.exception";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception";
import { IllegalArgumentException } from "@/type/exception/illegal.argument.exception";

export class UserRepository implements IUserRepository {
    private repository: Repository<UserEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(UserEntity);
    }

    public createUser(user: User): UserEntity {
        return this.repository.create(user);
    }

    public createUserAdmin(userAdmin: UserAdmin): UserEntity {
        return this.repository.create(userAdmin);
    }

    public async delete(id: string): Promise<void> {
        const result = await this.repository.delete(id);
        if (result.affected === 0) {
            throw new Error(`User with id ${id} not found`);
        }
    }

    public async exists(id: string): Promise<boolean> {
        const count = await this.repository.count({ where: { id } });
        return count > 0;
    }

    public async existsByEmail(email: string): Promise<boolean> {
        return await this.repository.existsBy({ email });
    }

    public async findAll(): Promise<UserEntity[]> {
        return await this.repository.find();
    }

    public async findByEmail(email: string): Promise<UserEntity> {
        if (!email) {
            throw new IllegalArgumentException(`Invalid email ${email}`);
        }

        const userEntity: null | UserEntity = await this.repository.findOneBy({
            email,
        });

        if (!userEntity) {
            throw new EntityNotFoundException(
                `User with email ${email} not found`,
            );
        }

        return userEntity;
    }

    public async findById(id: string): Promise<null | UserEntity> {
        return await this.repository.findOne({ where: { id } });
    }

    public async findByIdAndName(
        id: string,
        name?: string,
    ): Promise<null | UserEntity> {
        const queryBuilder = this.repository.createQueryBuilder("user");

        queryBuilder.where("user.id = :id", { id });

        if (name) {
            queryBuilder.andWhere("user.name ILIKE :name", {
                name: `${name}%`,
            });
        }

        return await queryBuilder.getOne();
    }

    public async saveUser(userEntity: UserEntity): Promise<UserEntity> {
        const emailExists: boolean = await this.existsByEmail(userEntity.email);

        if (emailExists) {
            throw new EntityExistsException(
                `User with email '${userEntity.email}' already exists`,
            );
        }
        return await this.repository.save(userEntity);
    }

    public async update(
        id: string,
        updateData: Partial<UserEntity>,
    ): Promise<UserEntity> {
        if (updateData.email) {
            const emailExists = await this.existsByEmail(updateData.email);
            if (emailExists) {
                throw new IllegalArgumentException(
                    `Email ${updateData.email} already exists`,
                );
            }
        }
        await this.repository.update(id, updateData);
        const updatedUser = await this.findById(id);
        if (!updatedUser) {
            throw new Error(`User with id ${id} not found after update`);
        }
        return updatedUser;
    }
}
