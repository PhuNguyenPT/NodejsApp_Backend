// src/dto/user/user.ts
import { Exclude, Expose, Type } from "class-transformer";

import { Permission, Role } from "@/type/enum/user.js";

/**
 * Data Transfer Object for user response
 * @example {
 *   "id": "644d97b3-f45f-4ae7-9b62-8bf02be11373",
 *   "email": "jane.doe@example.com",
 *   "name": "Jane Doe",
 *   "phoneNumbers": ["+1 (555) 123-4567", "+84 123 456 789"],
 *   "status": "Happy"
 * }
 */
@Exclude() // Exclude everything by default, then expose what we want
export class User {
    // Exclude audit fields from public API
    @Exclude()
    createdAt?: Date;

    @Exclude()
    createdBy?: string;

    @Expose()
    email!: string;

    @Expose()
    id!: string;

    @Expose()
    name?: string;

    @Exclude() // Always exclude password from responses
    password?: string;

    @Expose()
    phoneNumbers?: string[];

    @Exclude()
    updatedAt?: Date;

    @Exclude()
    updatedBy?: string;

    constructor(partial?: Partial<User>) {
        if (partial) {
            Object.assign(this, partial);
        }
    }
}

export class UserAdmin extends User {
    @Expose()
    @Type(() => Array)
    permissions!: Permission[];

    @Expose()
    @Type(() => String)
    role!: Role;
}
