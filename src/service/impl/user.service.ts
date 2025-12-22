import type { RedisClientType } from "redis";

import bcrypt from "bcrypt";
import { inject, injectable } from "inversify";
import { Repository } from "typeorm";
import { Logger } from "winston";

import type { IUserService } from "@/service/user-service.interface.js";

import { JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS } from "@/config/jwt.config.js";
import { CreateUserAdminDTO } from "@/dto/user/create-user.js";
import { UpdateUserAdminDTO } from "@/dto/user/update-user.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { TYPES } from "@/type/container/types.js";
import { getDefaultPermissionsByRole } from "@/type/enum/user.js";
import { EntityExistsException } from "@/type/exception/entity-exists.exception.js";
import { EntityNotFoundException } from "@/type/exception/entity-not-found.exception.js";
import { CacheKeys } from "@/util/cache-key.js";
@injectable()
export class UserService implements IUserService {
    private readonly SALT_ROUNDS = 12;

    constructor(
        @inject(TYPES.UserRepository)
        private readonly userRepository: Repository<UserEntity>,
        @inject(TYPES.Logger)
        private readonly logger: Logger,
        @inject(TYPES.RedisPublisher)
        private readonly redisClient: RedisClientType,
    ) {}

    public async create(
        createUserAdminDTO: CreateUserAdminDTO,
    ): Promise<UserEntity> {
        this.logger.info("Creating new user", {
            email: createUserAdminDTO.email,
        });

        const exists = await this.userRepository.exists({
            transaction: true,
            where: { email: createUserAdminDTO.email },
        });

        if (exists) {
            throw new EntityExistsException(
                `User with email ${createUserAdminDTO.email} already exists`,
            );
        }

        // Hash the password before saving
        createUserAdminDTO.password = await bcrypt.hash(
            createUserAdminDTO.password,
            this.SALT_ROUNDS,
        );
        const newUser: UserEntity =
            this.userRepository.create(createUserAdminDTO);

        newUser.permissions = getDefaultPermissionsByRole(newUser.role);

        const savedEntity: UserEntity = await this.userRepository.save(newUser);

        this.logger.info("User created successfully", {
            userId: savedEntity.id,
        });
        return savedEntity;
    }

    public async delete(id: string): Promise<void> {
        this.logger.info("Deleting user", { userId: id });

        await this.userRepository.delete(id);

        // Invalidate cache for the deleted user
        await this.invalidateUserCache(id);

        this.logger.info("User deleted successfully", { userId: id });
    }

    public async exists(id: string): Promise<boolean> {
        this.logger.info("Checking if user exists", { userId: id });

        const exists: boolean = await this.userRepository.exists({
            where: { id },
        });

        this.logger.info("User existence check completed", {
            exists,
            userId: id,
        });
        return exists;
    }

    public async getAll(): Promise<UserEntity[]> {
        this.logger.info("Retrieving all users");

        const userEntities: UserEntity[] = await this.userRepository.find({});

        this.logger.info("All users retrieved successfully", {
            count: userEntities.length,
        });
        return userEntities;
    }

    public async getById(id: string): Promise<UserEntity> {
        this.logger.info("Retrieving user by id", { userId: id });

        const userEntity: null | UserEntity = await this.userRepository.findOne(
            {
                cache: {
                    id: CacheKeys.user(id),
                    milliseconds: JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS,
                },
                where: { id },
            },
        );

        if (!userEntity) {
            this.logger.warn("User not found by id", { userId: id });
            throw new EntityNotFoundException(`User with id ${id} not found`);
        }

        this.logger.info("User retrieved successfully by id", {
            userId: userEntity.id,
        });
        return userEntity;
    }

    public async getByIdAndName(
        id: string,
        name?: string,
    ): Promise<UserEntity> {
        this.logger.info("Retrieving user", { name, userId: id });

        const userEntity: null | UserEntity = await this.userRepository.findOne(
            {
                cache: {
                    id: CacheKeys.user(id),
                    milliseconds: JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS,
                },
                transaction: true,
                where: { id, name },
            },
        );

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
    }

    public async update(
        id: string,
        updateData: Partial<UpdateUserAdminDTO>,
        user: Express.User,
    ): Promise<UserEntity> {
        this.logger.info("Updating user", {
            updatedFields: Object.keys(updateData),
            userId: id,
        });

        // Fetch existing user
        const existingUser = await this.userRepository.findOne({
            cache: {
                id: CacheKeys.user(id),
                milliseconds: JWT_ACCESS_TOKEN_EXPIRATION_IN_MILLISECONDS,
            },
            transaction: true,
            where: { id },
        });

        if (!existingUser) {
            throw new EntityNotFoundException(`User with id ${id} not found`);
        }

        // Hash password if provided
        if (updateData.password) {
            updateData.password = await bcrypt.hash(
                updateData.password,
                this.SALT_ROUNDS,
            );
        }

        // Merge updates into existing entity
        Object.assign(existingUser, updateData);
        existingUser.updatedBy = user.email;

        // Only update permissions if role is explicitly provided
        if (updateData.role !== undefined) {
            existingUser.permissions = getDefaultPermissionsByRole(
                updateData.role,
            );
            this.logger.info("Role updated, refreshing permissions", {
                newPermissions: existingUser.permissions,
                newRole: updateData.role,
                userId: id,
            });
        }

        // Save the updated entity
        const updatedEntity = await this.userRepository.save(existingUser);

        // Invalidate cache for this user
        await this.invalidateUserCache(id);

        this.logger.info("User updated successfully", { userId: id });
        return updatedEntity;
    }

    /**
     * Invalidate all cache entries related to a user
     * @param userId - The user's UUID
     */
    private async invalidateUserCache(userId: string): Promise<void> {
        const cacheKey = CacheKeys.user(userId);
        await this.redisClient.del(cacheKey);

        this.logger.info("User cache invalidated", {
            cacheKey,
            userId,
        });
    }
}
