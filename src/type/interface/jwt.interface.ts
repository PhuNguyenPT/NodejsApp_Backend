// src/type/interface/jwt.ts
import { JwtPayload } from "jsonwebtoken";

import { TokenType } from "@/entity/jwt.entity.js";
import { Permission, Role } from "@/type/enum/user.js";

// Extend the standard JwtPayload with our custom claims
export interface CustomJwtPayload extends JwtPayload {
    email: string;
    id: string;
    name?: string;
    permissions?: Permission[];
    role: Role;
    type: TokenType;
}
