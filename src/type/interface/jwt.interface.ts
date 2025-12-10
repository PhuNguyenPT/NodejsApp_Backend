// src/type/interface/jwt.ts
import type { JwtPayload } from "jsonwebtoken";

import type { TokenType } from "@/entity/security/jwt.entity.js";
import type { Permission, Role } from "@/type/enum/user.js";

// Extend the standard JwtPayload with our custom claims
export interface CustomJwtPayload extends JwtPayload {
    email: string;
    id: string;
    name?: string;
    permissions?: Permission[];
    role: Role;
    type: TokenType;
}
