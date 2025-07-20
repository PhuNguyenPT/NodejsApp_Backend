// src/users/usersService.ts
import { instanceToInstance } from "class-transformer";

import { CreateUserDto } from "@/dto/user/create.user.js";
import { UpdateUserDTO } from "@/dto/user/update.user.js";
import { User } from "@/dto/user/user.js";
import UserEntity from "@/entity/user.js";
import { UserRepository } from "@/repository/impl/user.repository.js";
import { IUserRepository } from "@/repository/user.repository.interface.js";
import { EntityNotFoundException } from "@/type/exception/user.not.found.exception";
import logger from "@/util/logger.js";

export class UsersService {
    private userRepository: IUserRepository;

    // Constructor injection - allows for better testing and flexibility
    constructor(userRepository?: IUserRepository) {
        this.userRepository = userRepository ?? new UserRepository();
    }

    public async create(createUserDto: CreateUserDto): Promise<User> {
        try {
            logger.info("Creating new user", createUserDto);

            const savedEntity = await this.userRepository.create(createUserDto);
            const user: User = instanceToInstance(savedEntity) as User;

            logger.info("User created successfully", {
                userId: savedEntity.id,
            });
            return user;
        } catch (error) {
            logger.error("Error creating user", { createUserDto, error });
            throw new Error("Failed to create user");
        }
    }

    public async delete(id: string): Promise<void> {
        try {
            logger.info("Deleting user", { userId: id });

            await this.userRepository.delete(id);

            logger.info("User deleted successfully", { userId: id });
        } catch (error) {
            logger.error("Error deleting user", { error, userId: id });
            throw new Error(`Failed to delete user with id ${id}`);
        }
    }

    public async exists(id: string): Promise<boolean> {
        try {
            logger.info("Checking if user exists", { userId: id });

            const exists = await this.userRepository.exists(id);

            logger.info("User existence check completed", {
                exists,
                userId: id,
            });
            return exists;
        } catch (error) {
            logger.error("Error checking user existence", {
                error,
                userId: id,
            });
            throw new Error(`Failed to check if user with id ${id} exists`);
        }
    }

    public async getAll(): Promise<User[]> {
        try {
            logger.info("Retrieving all users");

            const userEntities: UserEntity[] =
                await this.userRepository.findAll();
            const users: User[] = userEntities.map(
                (entity) => instanceToInstance(entity) as User,
            );

            logger.info("All users retrieved successfully", {
                count: users.length,
            });
            return users;
        } catch (error) {
            logger.error("Error retrieving all users", { error });
            throw new Error("Failed to retrieve users");
        }
    }

    public async getById(id: string): Promise<User> {
        try {
            logger.info("Retrieving user by id", { userId: id });

            const userEntity: null | UserEntity =
                await this.userRepository.findById(id);

            if (!userEntity) {
                logger.warn("User not found by id", { userId: id });
                throw new EntityNotFoundException(
                    `User with id ${id} not found`,
                );
            }

            const user: User = instanceToInstance(userEntity) as User;
            logger.info("User retrieved successfully by id", { userId: id });
            return user;
        } catch (error) {
            if (error instanceof EntityNotFoundException) {
                // Let EntityNotFoundException bubble up - it's expected behavior
                throw error;
            }

            // Log and wrap unexpected errors
            logger.error("Unexpected error retrieving user by id", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                userId: id,
            });
            throw new Error(`Failed to retrieve user with id ${id}`);
        }
    }

    public async getByIdAndName(id: string, name?: string): Promise<User> {
        try {
            logger.info("Retrieving user", { name, userId: id });

            const userEntity: null | UserEntity =
                await this.userRepository.findByIdAndName(id, name);

            if (!userEntity) {
                const errorMsg = name
                    ? `User with id ${id} and name ${name} not found`
                    : `User with id ${id} not found`;
                logger.warn("User not found", { name, userId: id });
                throw new EntityNotFoundException(errorMsg);
            }

            const user: User = instanceToInstance(userEntity) as User;
            logger.info("User retrieved successfully", { name, userId: id });
            return user;
        } catch (error) {
            if (error instanceof EntityNotFoundException) {
                // Let EntityNotFoundException bubble up - it's expected behavior
                throw error;
            }

            // Log and wrap unexpected errors
            logger.error("Unexpected error retrieving user", {
                error: error instanceof Error ? error.message : String(error),
                name,
                stack: error instanceof Error ? error.stack : undefined,
                userId: id,
            });

            // More descriptive error message that includes both parameters
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
            logger.info("Updating user", {
                updatedFields: Object.keys(updateData),
                userId: id,
            });

            const updatedEntity = await this.userRepository.update(
                id,
                updateData,
            );
            const user: User = instanceToInstance(updatedEntity) as User;

            logger.info("User updated successfully", { userId: id });
            return user;
        } catch (error) {
            logger.error("Error updating user", {
                error,
                updateData,
                userId: id,
            });
            throw new Error(`Failed to update user with id ${id}`);
        }
    }
}
