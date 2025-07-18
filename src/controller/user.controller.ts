// src/users/usersController.ts
import {
  Body,
  Controller,
  Example,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";

import { CreateUserDto } from "@/dto/user/create.user.js";
import { User } from "@/dto/user/user.js";
import validationMiddleware from "@/middleware/validation.middleware.js";
import { UsersService } from "@/service/user.service.js";

/**
 * Manages user-related operations.
 */
@Route("users")
@Tags("Users")
export class UsersController extends Controller {
  private usersService: UsersService = new UsersService();

  /**
   * Creates a new user in the system.
   * The request body will be validated to ensure it contains all required user fields.
   * @param requestBody The user information needed to create a new user.
   */
  @Example<CreateUserDto>({
    email: "jane.doe@example.com",
    name: "Jane Doe",
    phoneNumbers: ["+1 (555) 123-4567", "+84 123 456 789"],
    status: "Happy",
  })
  @Middlewares(validationMiddleware(CreateUserDto))
  @Post()
  @SuccessResponse("201", "Created")
  public async createUser(@Body() requestBody: CreateUserDto): Promise<User> {
    this.setStatus(201);
    const user = await this.usersService.create(requestBody);
    return user;
  }

  /**
   * Retrieves the details of a specific user.
   * @param userId The unique identifier of the user (UUID).
   * @param name Optional. A query to filter by the user's name.
   */
  @Get("{userId}")
  public async getUser(
    @Path() userId: string,
    @Query() name?: string,
  ): Promise<User> {
    return this.usersService.get(userId, name);
  }
}
