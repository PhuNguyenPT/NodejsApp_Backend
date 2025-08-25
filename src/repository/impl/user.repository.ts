// src/repository/impl/user.repository.ts
import { Repository } from "typeorm";

import { postgresDataSource } from "@/config/data.source.js";
import { User, UserAdmin } from "@/dto/user/user.js";
import { UserEntity } from "@/entity/user.js";
import { IUserRepository } from "@/repository/user.repository.interface.js";
import { EntityExistsException } from "@/type/exception/entity.exists.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity.not.found.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal.argument.exception.js";
import { JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS } from "@/util/jwt.options.js";

export class UserRepository implements IUserRepository {
    private repository: Repository<UserEntity>;

    constructor() {
        this.repository = postgresDataSource.getRepository(UserEntity);
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

        const userEntity = await this.repository
            .createQueryBuilder("u")
            .where("u.email = :email", { email })
            .cache(JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS)
            .getOne();

        if (!userEntity) {
            throw new EntityNotFoundException(
                `User with email ${email} not found`,
            );
        }

        return userEntity;
    }

    public async findById(id: string): Promise<null | UserEntity> {
        return this.repository.findOne({
            cache: {
                id: `user_cache_${id}`,
                milliseconds: JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS,
            },
            where: { id },
        });
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
        return await this.repository.manager.transaction(
            async (entityManager) => {
                const emailExists: boolean = await entityManager.existsBy(
                    UserEntity,
                    { email: userEntity.email },
                );

                if (emailExists) {
                    throw new EntityExistsException(
                        `User with email '${userEntity.email}' already exists`,
                    );
                }
                return await this.repository.save(userEntity);
            },
        );
    }

    /**
     * Updates a user entity.
     * This method uses a "read-modify-save" pattern to prevent type errors
     * with TypeORM's `update` method when dealing with entity relations.
     * @param id The ID of the user to update.
     * @param updateData A partial object of the user entity with fields to update.
     * @returns The updated user entity.
     */
    public async update(
        id: string,
        updateData: Partial<UserEntity>,
    ): Promise<UserEntity> {
        return await this.repository.manager.transaction(
            async (transactionManager) => {
                // First, find the existing entity to ensure it exists.
                const userToUpdate = await transactionManager.findOneBy(
                    UserEntity,
                    { id },
                );
                if (!userToUpdate) {
                    throw new EntityNotFoundException(
                        `User with id ${id} not found`,
                    );
                }

                // If the email is part of the update, check if the new email already exists
                // for a *different* user.
                if (
                    updateData.email &&
                    updateData.email !== userToUpdate.email
                ) {
                    const emailExists = await transactionManager.existsBy(
                        UserEntity,
                        { email: updateData.email },
                    );
                    if (emailExists) {
                        throw new IllegalArgumentException(
                            `Email ${updateData.email} already exists`,
                        );
                    }
                }

                // Use TypeORM's `merge` to safely apply the partial changes
                // to the fetched entity. This correctly handles relations.
                transactionManager.merge(UserEntity, userToUpdate, updateData);

                // Save the merged entity. TypeORM will issue an UPDATE query
                // because the entity has an existing ID.
                return transactionManager.save(userToUpdate);
            },
        );
    }
}
