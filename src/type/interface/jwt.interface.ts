// src/type/interface/jwt.ts
import type { JwtPayload } from "jsonwebtoken";

import type { TokenType } from "@/entity/security/jwt.entity.js";
import type { Permission, Role } from "@/type/enum/user.enum.js";

import type { UUID } from "../common/uuid.type.js";

// Extend the standard JwtPayload with our custom claims
export interface CustomJwtPayload extends JwtPayload {
    email: string;
    id: UUID;
    name?: string;
    permissions?: Permission[];
    role: Role;
    type: TokenType;
}
