// src/dto/auth/auth.response.ts
import { Expose } from "class-transformer";

import { User } from "@/dto/user/user.js";

export class AuthResponse {
    @Expose()
    accessToken?: string;

    @Expose()
    expiresIn?: string;

    @Expose()
    message?: string;

    @Expose()
    refreshToken!: string;

    @Expose()
    success!: boolean;

    @Expose()
    tokenType = "Bearer";

    @Expose()
    user!: User;

    constructor(partial?: Partial<AuthResponse>) {
        if (partial) {
            Object.assign(this, partial);
        }
    }
}
