import { instanceToInstance } from "class-transformer";
import { Repository } from "typeorm";

// src/users/usersService.ts
import { AppDataSource } from "@/config/data.source.js";
import { CreateUserDto } from "@/dto/user/create.user.js";
import { User } from "@/dto/user/user.js";
import UserEntity from "@/entity/user.js";

export class UsersService {
  private userRepository: Repository<UserEntity> =
    AppDataSource.getRepository(UserEntity);

  public async create(createUserDTO: CreateUserDto): Promise<User> {
    const userEntity: UserEntity = this.userRepository.create(createUserDTO);
    try {
      const savedEntity = await this.userRepository.save(userEntity);
      const user: User = instanceToInstance(savedEntity) as User;
      return user;
    } catch (error) {
      console.error("Error saving user:", error);
      throw new Error("Failed to create user");
    }
  }

  public async get(id: string, name?: string): Promise<User> {
    const userEntity: null | UserEntity = await this.userRepository.findOne({
      where: { id, name },
    });

    if (!userEntity) {
      throw new Error(`User with id ${id} not found`);
    }

    const user: User = instanceToInstance(userEntity) as User;
    return user;
  }
}
