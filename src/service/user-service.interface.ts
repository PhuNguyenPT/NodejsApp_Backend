import type { CreateUserAdminDTO } from "@/dto/user/create-user.js";
import type { UpdateUserAdminDTO } from "@/dto/user/update-user.js";
import type { UserEntity } from "@/entity/security/user.entity.js";
import type { UUID } from "@/type/common/uuid.type.js";

export interface IUserService {
    create(createUserAdminDTO: CreateUserAdminDTO): Promise<UserEntity>;
    delete(id: UUID): Promise<void>;
    exists(id: UUID): Promise<boolean>;
    getAll(): Promise<UserEntity[]>;
    getById(id: UUID): Promise<UserEntity>;
    getByIdAndName(id: UUID, name?: string): Promise<UserEntity>;
    update(
        id: UUID,
        updateData: Partial<UpdateUserAdminDTO>,
        user: Express.User,
    ): Promise<UserEntity>;
}
