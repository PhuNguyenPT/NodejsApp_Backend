// src/type/container/type.ts
export const TYPES = {
    AuthService: Symbol.for("AuthService"),
    AwardRepository: Symbol.for("AwardRepository"),
    CertificationRepository: Symbol.for("CertificationRepository"),
    JWTService: Symbol.for("JWTService"),
    KeyStore: Symbol.for("KeyStore"),
    Logger: Symbol.for("Logger"),
    PassportConfig: Symbol.for("PassportConfig"),
    StudentRepository: Symbol.for("StudentRepository"),
    StudentService: Symbol.for("StudentService"),
    UserRepository: Symbol.for("UserRepository"),
    UserService: Symbol.for("UserService"),
} as const;
