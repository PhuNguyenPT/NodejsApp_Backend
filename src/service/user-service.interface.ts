import type { CreateUserAdminDTO } from "@/dto/user/create-user.js";
import type { UpdateUserAdminDTO } from "@/dto/user/update-user.js";
import type { UserEntity } from "@/entity/security/user.entity.js";

export interface IUserService {
    create(createUserAdminDTO: CreateUserAdminDTO): Promise<UserEntity>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
    getAll(): Promise<UserEntity[]>;
    getById(id: string): Promise<UserEntity>;
    getByIdAndName(id: string, name?: string): Promise<UserEntity>;
    update(
        id: string,
        updateData: Partial<UpdateUserAdminDTO>,
        user: Express.User,
    ): Promise<UserEntity>;
}
