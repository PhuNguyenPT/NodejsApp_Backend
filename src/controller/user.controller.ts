import { inject, injectable } from "inversify";
import {
    Body,
    Controller,
    Delete,
    Get,
    Middlewares,
    Patch,
    Path,
    Post,
    Produces,
    Query,
    Request,
    Response,
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";

import type { IUserService } from "@/service/user-service.interface.js";

import { CreateUserAdminDTO } from "@/dto/user/create-user.js";
import { UpdateUserAdminDTO } from "@/dto/user/update-user.js";
import { UserAdmin } from "@/dto/user/user.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { UserMapper } from "@/mapper/user-mapper.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { TYPES } from "@/type/container/types.js";
import { HttpStatus } from "@/type/enum/http-status.js";

/**
 * Manages user-related operations including CRUD operations for user accounts.
 */
@injectable()
@Route("users")
@Tags("Users")
export class UserController extends Controller {
    constructor(
        @inject(TYPES.IUserService)
        private readonly userService: IUserService,
    ) {
        super();
    }

    /**
     * Check if a user exists in the system by their ID.
     * This is useful for validation before performing operations that require an existing user.
     * @summary Check user existence
     * @param userId The UUID of the user to check.
     * @returns {object} Boolean indicating whether the user exists.
     */
    @Get("{userId}/exists")
    @Middlewares(validateUuidParams("userId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth", ["user:read"])
    @SuccessResponse(HttpStatus.OK, "Successfully checked user existence")
    public async checkUserExists(
        @Path("userId") userId: string,
    ): Promise<{ exists: boolean }> {
        const exists = await this.userService.exists(userId);
        return { exists };
    }

    /**
     * Create a new user in the system.
     * The password will be hashed before storage, and default permissions will be assigned based on the user's role.
     * @summary Create new user
     * @param requestBody The user information including email, password, name, and role.
     * @returns {UserAdmin} The newly created user with assigned permissions.
     * @throws {EntityExistsException} If a user with the same email already exists.
     */
    @Middlewares(validateDTO(CreateUserAdminDTO))
    @Post()
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.CONFLICT, "User with email already exists")
    @Security("bearerAuth", ["user:create"])
    @SuccessResponse(HttpStatus.CREATED, "Created")
    public async createUser(
        @Body() requestBody: CreateUserAdminDTO,
    ): Promise<UserAdmin> {
        const userEntity: UserEntity =
            await this.userService.create(requestBody);
        const responseDTO: UserAdmin = UserMapper.toUserAdmin(userEntity);
        return responseDTO;
    }

    /**
     * Delete a user from the system permanently.
     * This operation cannot be undone and will also invalidate all cached user data.
     * @summary Delete user
     * @param userId The UUID of the user to delete.
     * @throws {EntityNotFoundException} If the user is not found.
     */
    @Delete("{userId}")
    @Middlewares(validateUuidParams("userId"))
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "User not found")
    @Security("bearerAuth", ["user:delete"])
    @SuccessResponse(HttpStatus.NO_CONTENT, "Successfully deleted user")
    public async deleteUser(@Path("userId") userId: string): Promise<void> {
        await this.userService.delete(userId);
    }

    /**
     * Retrieve all users in the system.
     * This endpoint returns the complete list of users without pagination.
     * @summary Get all users
     * @returns {UserAdmin[]} An array of all users in the system.
     */
    @Get()
    @Produces("application/json")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Security("bearerAuth", ["user:read", "user:list"])
    @SuccessResponse(HttpStatus.OK, "Successfully retrieved all users")
    public async getAllUsers(): Promise<UserAdmin[]> {
        const userEntities: UserEntity[] = await this.userService.getAll();
        const responseArray: UserAdmin[] =
            UserMapper.toUserAdmins(userEntities);
        return responseArray;
    }

    /**
     * Retrieve a specific user by ID with optional name filtering.
     * This endpoint allows querying by both ID and name for more specific searches.
     * Results are cached to improve performance.
     * @summary Get user by ID and optional name
     * @param userId The UUID of the user to retrieve.
     * @param name Optional name filter to match against the user's name.
     * @returns {UserAdmin} The user matching the provided criteria.
     * @throws {EntityNotFoundException} If no user matches the provided criteria.
     */
    @Get("{userId}/search")
    @Middlewares(validateUuidParams("userId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "User not found")
    @Security("bearerAuth", ["user:read"])
    @SuccessResponse(HttpStatus.OK, "Successfully retrieved user")
    public async getUser(
        @Path("userId") userId: string,
        @Query() name?: string,
    ): Promise<UserAdmin> {
        const userEntity: UserEntity = await this.userService.getByIdAndName(
            userId,
            name,
        );
        const responseDTO: UserAdmin = UserMapper.toUserAdmin(userEntity);
        return responseDTO;
    }

    /**
     * Retrieve a specific user by their ID.
     * Results are cached to improve performance on repeated queries.
     * @summary Get user by ID
     * @param userId The UUID of the user to retrieve.
     * @returns {UserAdmin} The user details.
     * @throws {EntityNotFoundException} If the user is not found.
     */
    @Get("{userId}")
    @Middlewares(validateUuidParams("userId"))
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "User not found")
    @Security("bearerAuth", ["user:read"])
    @SuccessResponse(HttpStatus.OK, "Successfully retrieved user")
    public async getUserById(
        @Path("userId") userId: string,
    ): Promise<UserAdmin> {
        const userEntity: UserEntity = await this.userService.getById(userId);
        const responseDTO: UserAdmin = UserMapper.toUserAdmin(userEntity);
        return responseDTO;
    }

    /**
     * Update an existing user's information.
     * Only provided fields will be updated, others will remain unchanged.
     * If the password is updated, it will be hashed before storage.
     * If the role is updated, permissions will be automatically refreshed based on the new role.
     * The user cache will be invalidated after update.
     * @summary Update user
     * @param userId The UUID of the user to update.
     * @param requestBody Partial user data containing the fields to update.
     * @param request The authenticated request containing the user performing the update.
     * @returns {UserAdmin} The updated user details.
     * @throws {EntityNotFoundException} If the user is not found.
     */
    @Middlewares(validateUuidParams("userId"), validateDTO(UpdateUserAdminDTO))
    @Patch("{userId}")
    @Produces("application/json")
    @Response<string>(HttpStatus.UNPROCESSABLE_ENTITY, "Validation error")
    @Response<string>(HttpStatus.UNAUTHORIZED, "Authentication required")
    @Response<string>(HttpStatus.NOT_FOUND, "User not found")
    @Security("bearerAuth", ["user:update"])
    @SuccessResponse(HttpStatus.OK, "Successfully updated user")
    public async updateUser(
        @Path("userId") userId: string,
        @Body() requestBody: UpdateUserAdminDTO,
        @Request() request: Express.AuthenticatedRequest,
    ): Promise<UserAdmin> {
        const user: Express.User = request.user;
        const userEntity = await this.userService.update(
            userId,
            requestBody,
            user,
        );
        const responseDTO: UserAdmin = UserMapper.toUserAdmin(userEntity);
        return responseDTO;
    }
}
