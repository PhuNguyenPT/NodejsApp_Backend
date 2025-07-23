// types/express.d.ts

declare global {
    namespace Express {
        interface User {
            email: string;
            exp?: number;
            iat?: number;
            id: string;
            name?: string;
            status: UserStatus;
        }
    }
}

export {};
