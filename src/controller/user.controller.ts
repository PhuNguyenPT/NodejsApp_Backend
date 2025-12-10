import { inject, injectable } from "inversify";
// src/users/usersController.ts
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
    Route,
    Security,
    SuccessResponse,
    Tags,
} from "tsoa";

import type { IUserService } from "@/service/user-service.interface.js";
import type { AuthenticatedRequest } from "@/type/express/express.js";

import { CreateUserAdminDTO } from "@/dto/user/create-user.js";
import { UpdateUserAdminDTO } from "@/dto/user/update-user.js";
import { UserAdmin } from "@/dto/user/user.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { UserMapper } from "@/mapper/user-mapper.js";
import { validateUuidParams } from "@/middleware/uuid-validation-middleware.js";
import validateDTO from "@/middleware/validation-middleware.js";
import { TYPES } from "@/type/container/types.js";

/**
 * Manages user-related operations.
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
     * Checks if a user exists in the system.
     * @param userId The unique identifier of the user to check.
     * @returns Boolean indicating whether the user exists.
     */
    @Get("{userId}/exists")
    @Middlewares(validateUuidParams("userId"))
    @Produces("application/json")
    @Security("bearerAuth", ["user:read"])
    @SuccessResponse("200", "Successfully checked user existence")
    public async checkUserExists(
        @Path() userId: string,
    ): Promise<{ exists: boolean }> {
        const exists = await this.userService.exists(userId);
        return { exists };
    }

    /**
     * Creates a new user in the system.
     * The request body will be validated to ensure it contains all required user fields.
     * @param requestBody The user information needed to create a new user.
     */
    @Middlewares(validateDTO(CreateUserAdminDTO))
    @Post()
    @Produces("application/json")
    @Security("bearerAuth", ["user:create"])
    @SuccessResponse("201", "Created")
    public async createUser(
        @Body() requestBody: CreateUserAdminDTO,
    ): Promise<UserAdmin> {
        const userEntity: UserEntity =
            await this.userService.create(requestBody);
        const responseDTO: UserAdmin = UserMapper.toUserAdmin(userEntity);
        return responseDTO;
    }

    /**
     * Deletes a user from the system.
     * This operation cannot be undone.
     * @param userId The unique identifier of the user to delete.
     */
    @Delete("{userId}")
    @Middlewares(validateUuidParams("userId"))
    @Security("bearerAuth", ["user:delete"])
    @SuccessResponse("204", "Successfully deleted user")
    public async deleteUser(@Path() userId: string): Promise<void> {
        await this.userService.delete(userId);
    }

    /**
     * Retrieves all users in the system.
     * @returns An array of all users.
     */
    @Get()
    @Produces("application/json")
    @Security("bearerAuth", ["user:read", "user:list"])
    @SuccessResponse("200", "Successfully retrieved all users")
    public async getAllUsers(): Promise<UserAdmin[]> {
        const userEntities: UserEntity[] = await this.userService.getAll();
        const responseArray: UserAdmin[] =
            UserMapper.toUserAdmins(userEntities);
        return responseArray;
    }

    /**
     * Retrieves the details of a specific user with optional name filtering.
     * This endpoint allows querying by both ID and name for more specific searches.
     * @param userId The unique identifier of the user (UUID).
     * @param name Optional. A query to filter by the user's name.
     */
    @Get("{userId}/search")
    @Middlewares(validateUuidParams("userId"))
    @Produces("application/json")
    @Security("bearerAuth", ["user:read"])
    @SuccessResponse("200", "Successfully retrieved user")
    public async getUser(
        @Path() userId: string,
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
     * Retrieves the details of a specific user by ID.
     * @param userId The unique identifier of the user (UUID).
     */
    @Get("{userId}")
    @Middlewares(validateUuidParams("userId"))
    @Produces("application/json")
    @Security("bearerAuth", ["user:read"])
    @SuccessResponse("200", "Successfully retrieved user")
    public async getUserById(@Path() userId: string): Promise<UserAdmin> {
        const userEntity: UserEntity = await this.userService.getById(userId);
        const responseDTO: UserAdmin = UserMapper.toUserAdmin(userEntity);
        return responseDTO;
    }

    /**
     * Updates an existing user's information.
     * Only provided fields will be updated, others will remain unchanged.
     * @param userId The unique identifier of the user to update.
     * @param requestBody Partial user data containing the fields to update.
     */
    @Middlewares(validateUuidParams("userId"), validateDTO(UpdateUserAdminDTO))
    @Patch("{userId}")
    @Produces("application/json")
    @Security("bearerAuth", ["user:update"])
    @SuccessResponse("200", "Successfully updated user")
    public async updateUser(
        @Path() userId: string,
        @Body() requestBody: UpdateUserAdminDTO,
        @Request() request: AuthenticatedRequest,
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
