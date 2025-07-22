// src/type/container/type.ts
export const TYPES = {
    AuthController: Symbol.for("AuthController"),
    KeyStore: Symbol.for("KeyStore"),
    Logger: Symbol.for("Logger"),
    UserController: Symbol.for("UserController"),
    UserRepository: Symbol.for("UserRepository"),
    UserService: Symbol.for("UserService"),
} as const;
