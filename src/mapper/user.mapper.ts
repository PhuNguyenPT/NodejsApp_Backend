import { plainToInstance } from "class-transformer";

import { UserAdmin } from "@/dto/user/user";
import { UserEntity } from "@/entity/user";

export const UserMapper = {
    /**
     * Transform UserEntity to UserAdmin DTO
     */
    toUserAdmin(userEntity: UserEntity): UserAdmin {
        return plainToInstance(UserAdmin, userEntity, {
            excludeExtraneousValues: true,
        });
    },
    /**
     * Transform multiple UserEntities to User DTOs
     */
    toUserAdmins(entities: UserEntity[]): UserAdmin[] {
        return entities.map((entity) => this.toUserAdmin(entity));
    },
};
