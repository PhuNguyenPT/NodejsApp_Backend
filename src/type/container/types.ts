// src/type/container/type.ts
export const TYPES = {
    AuthController: Symbol.for("AuthController"),
    AuthService: Symbol.for("AuthService"),
    JWTService: Symbol.for("JWTService"),
    KeyStore: Symbol.for("KeyStore"),
    Logger: Symbol.for("Logger"),
    PassportConfig: Symbol.for("PassportConfig"),
    UserController: Symbol.for("UserController"),
    UserRepository: Symbol.for("UserRepository"),
    UserService: Symbol.for("UserService"),
} as const;
