// types/express.d.ts

import { Role, UserStatus } from "@/type/enum/user.js";

declare global {
    namespace Express {
        interface User {
            email: string;
            exp?: number;
            iat?: number;
            id: string;
            name?: string;
            role: Role;
            status?: UserStatus;
        }
    }
}
export interface AuthenticatedRequest extends Express.Request {
    user: Express.User; // Required, not optional
}
export {};
