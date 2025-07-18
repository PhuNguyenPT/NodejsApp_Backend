// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Route,
  SuccessResponse,
} from "tsoa";

import { CreateUserDto } from "@/dto/create.user.js";
import validationMiddleware from "@/middleware/validation.middleware.js";
import { UsersService } from "@/service/user.service.js";
import { User } from "@/type/interface/user.js";

@Route("users")
export class UsersController extends Controller {
  private usersService: UsersService = new UsersService();

  @Middlewares(validationMiddleware(CreateUserDto))
  @Post()
  @SuccessResponse("201", "Created")
  public async createUser(@Body() requestBody: CreateUserDto): Promise<User> {
    this.setStatus(201);
    const user = await this.usersService.create(requestBody);
    return user;
  }

  @Get("{userId}")
  public async getUser(
    @Path() userId: string,
    @Query() name?: string,
  ): Promise<User> {
    return this.usersService.get(userId, name);
  }
}
