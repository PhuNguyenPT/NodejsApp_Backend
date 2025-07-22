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
    Query,
    Route,
    SuccessResponse,
    Tags,
} from "tsoa";

import { CreateUserDto } from "@/dto/user/create.user.js";
import { UpdateUserDTO } from "@/dto/user/update.user.js";
import { User } from "@/dto/user/user.js";
import { validateUuidParam } from "@/middleware/uuid.validation.middleware";
import validateDTO from "@/middleware/validation.middleware.js";
import { UserService } from "@/service/user.service.js";
import { TYPES } from "@/type/container/types";

/**
 * Manages user-related operations.
 */
@injectable()
@Route("users")
@Tags("Users")
export class UserController extends Controller {
    constructor(
        @inject(TYPES.UserService)
        private readonly userService: UserService,
    ) {
        super();
    }

    /**
     * Checks if a user exists in the system.
     * @param userId The unique identifier of the user to check.
     * @returns Boolean indicating whether the user exists.
     */
    @Get("{userId}/exists")
    @Middlewares(validateUuidParam("userId"))
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
    @Middlewares(validateDTO(CreateUserDto))
    @Post()
    @SuccessResponse("201", "Created")
    public async createUser(@Body() requestBody: CreateUserDto): Promise<User> {
        const user = await this.userService.create(requestBody);
        return user;
    }

    /**
     * Deletes a user from the system.
     * This operation cannot be undone.
     * @param userId The unique identifier of the user to delete.
     */
    @Delete("{userId}")
    @Middlewares(validateUuidParam("userId"))
    @SuccessResponse("204", "Successfully deleted user")
    public async deleteUser(@Path() userId: string): Promise<void> {
        await this.userService.delete(userId);
    }

    /**
     * Retrieves all users in the system.
     * @returns An array of all users.
     */
    @Get()
    @SuccessResponse("200", "Successfully retrieved all users")
    public async getAllUsers(): Promise<User[]> {
        return this.userService.getAll();
    }

    /**
     * Retrieves the details of a specific user with optional name filtering.
     * This endpoint allows querying by both ID and name for more specific searches.
     * @param userId The unique identifier of the user (UUID).
     * @param name Optional. A query to filter by the user's name.
     */
    @Get("{userId}/search")
    @Middlewares(validateUuidParam("userId"))
    @SuccessResponse("200", "Successfully retrieved user")
    public async getUser(
        @Path() userId: string,
        @Query() name?: string,
    ): Promise<User> {
        return this.userService.getByIdAndName(userId, name);
    }

    /**
     * Retrieves the details of a specific user by ID.
     * @param userId The unique identifier of the user (UUID).
     */
    @Get("{userId}")
    @Middlewares(validateUuidParam("userId"))
    @SuccessResponse("200", "Successfully retrieved user")
    public async getUserById(@Path() userId: string): Promise<User> {
        return this.userService.getById(userId);
    }

    /**
     * Updates an existing user's information.
     * Only provided fields will be updated, others will remain unchanged.
     * @param userId The unique identifier of the user to update.
     * @param requestBody Partial user data containing the fields to update.
     */
    @Middlewares(validateUuidParam("userId"), validateDTO(UpdateUserDTO))
    @Patch("{userId}")
    @SuccessResponse("200", "Successfully updated user")
    public async updateUser(
        @Path() userId: string,
        @Body() requestBody: UpdateUserDTO,
    ): Promise<User> {
        return this.userService.update(userId, requestBody);
    }
}
