// types/express.d.ts

import { Permission, Role, UserStatus } from "@/type/enum/user.enum.ts";

import type { UUID } from "../common/uuid.type.ts";

declare global {
    namespace Express {
        interface User {
            email: string;
            exp?: number;
            iat?: number;
            id: UUID;
            name?: string;
            permissions: Permission[];
            role: Role;
            status?: UserStatus;
        }
    }
}

export {};
