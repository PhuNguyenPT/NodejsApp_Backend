// src/service/user.service.ts
import { instanceToInstance } from "class-transformer";
import { inject, injectable } from "inversify";

import { CreateUserDto } from "@/dto/user/create.user.js";
import { UpdateUserDTO } from "@/dto/user/update.user.js";
import { User } from "@/dto/user/user.js";
import UserEntity from "@/entity/user.js";
import { IUserRepository } from "@/repository/user.repository.interface.js";
import { TYPES } from "@/type/container/types.js";
import { EntityNotFoundException } from "@/type/exception/user.not.found.exception.js";
import { ILogger } from "@/type/interface/logger.js";

@injectable()
export class UserService {
    constructor(
        @inject(TYPES.UserRepository)
        private readonly userRepository: IUserRepository,
        @inject(TYPES.Logger)
        private readonly logger: ILogger, // Now properly typed!
    ) {}

    public async create(createUserDto: CreateUserDto): Promise<User> {
        try {
            this.logger.info("Creating new user", { createUserDto });

            const savedEntity = await this.userRepository.create(createUserDto);
            const user: User = instanceToInstance(savedEntity) as User;

            this.logger.info("User created successfully", {
                userId: savedEntity.id,
            });
            return user;
        } catch (error) {
            this.logger.error("Error creating user", {
                createUserDto,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new Error("Failed to create user");
        }
    }

    public async delete(id: string): Promise<void> {
        try {
            this.logger.info("Deleting user", { userId: id });

            await this.userRepository.delete(id);

            this.logger.info("User deleted successfully", { userId: id });
        } catch (error) {
            this.logger.error("Error deleting user", {
                error: error instanceof Error ? error.message : String(error),
                userId: id,
            });
            throw new Error(`Failed to delete user with id ${id}`);
        }
    }

    public async exists(id: string): Promise<boolean> {
        try {
            this.logger.info("Checking if user exists", { userId: id });

            const exists = await this.userRepository.exists(id);

            this.logger.info("User existence check completed", {
                exists,
                userId: id,
            });
            return exists;
        } catch (error) {
            this.logger.error("Error checking user existence", {
                error: error instanceof Error ? error.message : String(error),
                userId: id,
            });
            throw new Error(`Failed to check if user with id ${id} exists`);
        }
    }

    public async getAll(): Promise<User[]> {
        try {
            this.logger.info("Retrieving all users");

            const userEntities: UserEntity[] =
                await this.userRepository.findAll();
            const users: User[] = userEntities.map(
                (entity) => instanceToInstance(entity) as User,
            );

            this.logger.info("All users retrieved successfully", {
                count: users.length,
            });
            return users;
        } catch (error) {
            this.logger.error("Error retrieving all users", {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new Error("Failed to retrieve users");
        }
    }

    public async getById(id: string): Promise<User> {
        try {
            this.logger.info("Retrieving user by id", { userId: id });

            const userEntity: null | UserEntity =
                await this.userRepository.findById(id);

            if (!userEntity) {
                this.logger.warn("User not found by id", { userId: id });
                throw new EntityNotFoundException(
                    `User with id ${id} not found`,
                );
            }

            const user: User = instanceToInstance(userEntity) as User;
            this.logger.info("User retrieved successfully by id", {
                userId: id,
            });
            return user;
        } catch (error) {
            if (error instanceof EntityNotFoundException) {
                throw error;
            }

            this.logger.error("Unexpected error retrieving user by id", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                userId: id,
            });
            throw new Error(`Failed to retrieve user with id ${id}`);
        }
    }

    public async getByIdAndName(id: string, name?: string): Promise<User> {
        try {
            this.logger.info("Retrieving user", { name, userId: id });

            const userEntity: null | UserEntity =
                await this.userRepository.findByIdAndName(id, name);

            if (!userEntity) {
                const errorMsg = name
                    ? `User with id ${id} and name ${name} not found`
                    : `User with id ${id} not found`;
                this.logger.warn("User not found", { name, userId: id });
                throw new EntityNotFoundException(errorMsg);
            }

            const user: User = instanceToInstance(userEntity) as User;
            this.logger.info("User retrieved successfully", {
                name,
                userId: id,
            });
            return user;
        } catch (error) {
            if (error instanceof EntityNotFoundException) {
                throw error;
            }

            this.logger.error("Unexpected error retrieving user", {
                error: error instanceof Error ? error.message : String(error),
                name,
                stack: error instanceof Error ? error.stack : undefined,
                userId: id,
            });

            const errorMsg = name
                ? `Failed to retrieve user with id ${id} and name ${name}`
                : `Failed to retrieve user with id ${id}`;
            throw new Error(errorMsg);
        }
    }

    public async update(
        id: string,
        updateData: Partial<UpdateUserDTO>,
    ): Promise<User> {
        try {
            this.logger.info("Updating user", {
                updatedFields: Object.keys(updateData),
                userId: id,
            });

            const updatedEntity = await this.userRepository.update(
                id,
                updateData,
            );
            const user: User = instanceToInstance(updatedEntity) as User;

            this.logger.info("User updated successfully", { userId: id });
            return user;
        } catch (error) {
            this.logger.error("Error updating user", {
                error: error instanceof Error ? error.message : String(error),
                updateData,
                userId: id,
            });
            throw new Error(`Failed to update user with id ${id}`);
        }
    }
}
