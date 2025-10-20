import bcrypt from "bcrypt";
import { plainToInstance } from "class-transformer";
// src/service/user.service.ts
import { inject, injectable } from "inversify";
import { EntityMetadataNotFoundError } from "typeorm";
import { Logger } from "winston";

import { CreateUserAdminDTO } from "@/dto/user/create-user.js";
import { UpdateUserAdminDTO } from "@/dto/user/update-user.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { IUserRepository } from "@/repository/user-repository-interface.js";
import { IUserService } from "@/service/user-service.interface.js";
import { TYPES } from "@/type/container/types.js";
import { getDefaultPermissionsByRole } from "@/type/enum/user.js";
import { EntityExistsException } from "@/type/exception/entity-exists.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { IllegalArgumentException } from "@/type/exception/illegal-argument.exception.js";

@injectable()
export class UserService implements IUserService {
    private readonly SALT_ROUNDS = 12;

    constructor(
        @inject(TYPES.IUserRepository)
        private readonly userRepository: IUserRepository,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
    ) {}

    public async create(
        createUserAdminDTO: CreateUserAdminDTO,
    ): Promise<UserEntity> {
        try {
            this.logger.info("Creating new user", {
                email: createUserAdminDTO.email,
            });

            // Hash the password before saving
            createUserAdminDTO.password = await bcrypt.hash(
                createUserAdminDTO.password,
                this.SALT_ROUNDS,
            );
            const newUser: UserEntity = plainToInstance(
                UserEntity,
                createUserAdminDTO,
            );
            newUser.permissions = getDefaultPermissionsByRole(newUser.role);

            const savedEntity: UserEntity =
                await this.userRepository.saveUser(newUser);
            this.logger.info("User created successfully", {
                userId: savedEntity.id,
            });
            return savedEntity;
        } catch (error) {
            if (
                error instanceof IllegalArgumentException ||
                error instanceof EntityMetadataNotFoundError ||
                error instanceof EntityExistsException
            ) {
                throw error;
            }
            this.logger.error("Error creating user", {
                createUserAdminDTO,
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
            if (error instanceof EntityMetadataNotFoundError) {
                throw error;
            }
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

            const exists: boolean = await this.userRepository.exists(id);

            this.logger.info("User existence check completed", {
                exists,
                userId: id,
            });
            return exists;
        } catch (error) {
            if (error instanceof EntityMetadataNotFoundError) {
                throw error;
            }
            this.logger.error("Error checking user existence", {
                error: error instanceof Error ? error.message : String(error),
                userId: id,
            });
            throw new Error(`Failed to check if user with id ${id} exists`);
        }
    }

    public async getAll(): Promise<UserEntity[]> {
        try {
            this.logger.info("Retrieving all users");

            const userEntities: UserEntity[] =
                await this.userRepository.findAll();

            this.logger.info("All users retrieved successfully", {
                count: userEntities.length,
            });
            return userEntities;
        } catch (error) {
            if (error instanceof EntityMetadataNotFoundError) {
                throw error;
            }
            this.logger.error("Error retrieving all users", {
                error: error instanceof Error ? error.message : String(error),
                originalError:
                    error instanceof Error ? error.name : String(error),
            });
            throw new Error("Failed to retrieve users");
        }
    }

    public async getById(id: string): Promise<UserEntity> {
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

            this.logger.info("User retrieved successfully by id", {
                userId: userEntity.id,
            });
            return userEntity;
        } catch (error) {
            if (
                error instanceof EntityNotFoundException ||
                error instanceof EntityMetadataNotFoundError
            ) {
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

    public async getByIdAndName(
        id: string,
        name?: string,
    ): Promise<UserEntity> {
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

            this.logger.info("User retrieved successfully", {
                name,
                userId: id,
            });
            return userEntity;
        } catch (error) {
            if (
                error instanceof EntityNotFoundException ||
                error instanceof EntityMetadataNotFoundError
            ) {
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
        updateData: Partial<UpdateUserAdminDTO>,
        user: Express.User,
    ): Promise<UserEntity> {
        try {
            this.logger.info("Updating user", {
                updatedFields: Object.keys(updateData),
                userId: id,
            });

            if (updateData.password) {
                updateData.password = await bcrypt.hash(
                    updateData.password,
                    this.SALT_ROUNDS,
                );
            }

            const userEntity: UserEntity = plainToInstance(
                UserEntity,
                updateData,
            );
            userEntity.updatedBy = user.email;

            // Only update permissions if role is explicitly provided in update data
            if (updateData.role !== undefined) {
                userEntity.permissions = getDefaultPermissionsByRole(
                    updateData.role,
                );
                this.logger.info("Role updated, refreshing permissions", {
                    newPermissions: userEntity.permissions,
                    newRole: updateData.role,
                    userId: id,
                });
            }

            const updatedEntity: UserEntity = await this.userRepository.update(
                id,
                userEntity,
            );

            this.logger.info("User updated successfully", { userId: id });
            return updatedEntity;
        } catch (error) {
            if (
                error instanceof IllegalArgumentException ||
                error instanceof EntityMetadataNotFoundError ||
                error instanceof EntityExistsException
            ) {
                throw error;
            }
            this.logger.error("Error updating user", {
                error: error instanceof Error ? error.message : String(error),
                updateData,
                userId: id,
            });
            throw new Error(`Failed to update user with id ${id}`);
        }
    }
}
