// src/app/ioc.container.ts
import { Container } from "inversify";
import { Repository } from "typeorm";

import { AppDataSource } from "@/config/data.source.js";
import { PassportConfig } from "@/config/passport.config.js";
import { AuthController } from "@/controller/auth.controller.js";
import { FileController } from "@/controller/file.controller.js";
import { StudentController } from "@/controller/student.controller.js";
import { UserController } from "@/controller/user.controller.js";
import { AwardEntity } from "@/entity/award.js";
import { CertificationEntity } from "@/entity/certification.js";
import { FileEntity } from "@/entity/file.js";
import { StudentEntity } from "@/entity/student.js";
import { UserEntity } from "@/entity/user.js";
import { UserRepository } from "@/repository/impl/user.repository.js";
import { IUserRepository } from "@/repository/user.repository.interface.js";
import { AuthService } from "@/service/auth.service.js";
import { FileService } from "@/service/file.service.js";
import { JWTService } from "@/service/jwt.service.js";
import { StudentService } from "@/service/student.service.js";
import { UserService } from "@/service/user.service.js";
import { KeyStore } from "@/type/class/keystore.js";
import { TYPES } from "@/type/container/types.js";
import { ILogger } from "@/type/interface/logger.js";
import { WinstonLoggerService } from "@/util/logger.js";

const iocContainer = new Container();

iocContainer
    .bind<ILogger>(TYPES.Logger)
    .to(WinstonLoggerService)
    .inSingletonScope();

iocContainer
    .bind<IUserRepository>(TYPES.IUserRepository)
    .to(UserRepository)
    .inSingletonScope();

iocContainer
    .bind<Repository<StudentEntity>>(TYPES.StudentRepository)
    .toDynamicValue(() => AppDataSource.getRepository(StudentEntity))
    .inSingletonScope();

iocContainer
    .bind<Repository<AwardEntity>>(TYPES.AwardRepository)
    .toDynamicValue(() => AppDataSource.getRepository(AwardEntity))
    .inSingletonScope();

iocContainer
    .bind<Repository<CertificationEntity>>(TYPES.CertificationRepository)
    .toDynamicValue(() => AppDataSource.getRepository(CertificationEntity))
    .inSingletonScope();

iocContainer
    .bind<Repository<UserEntity>>(TYPES.UserRepository)
    .toDynamicValue(() => AppDataSource.getRepository(UserEntity))
    .inSingletonScope();

iocContainer
    .bind<Repository<FileEntity>>(TYPES.FileRepository)
    .toDynamicValue(() => AppDataSource.getRepository(FileEntity))
    .inSingletonScope();

iocContainer
    .bind<UserService>(TYPES.UserService)
    .to(UserService)
    .inSingletonScope();

iocContainer
    .bind<JWTService>(TYPES.JWTService)
    .to(JWTService)
    .inSingletonScope();

iocContainer
    .bind<AuthService>(TYPES.AuthService)
    .to(AuthService)
    .inSingletonScope();

iocContainer
    .bind<StudentService>(TYPES.StudentService)
    .to(StudentService)
    .inSingletonScope();

iocContainer
    .bind<FileService>(TYPES.FileService)
    .to(FileService)
    .inSingletonScope();

iocContainer
    .bind<PassportConfig>(TYPES.PassportConfig)
    .to(PassportConfig)
    .inSingletonScope();

iocContainer.bind<KeyStore>(TYPES.KeyStore).to(KeyStore).inSingletonScope();

iocContainer.bind<UserController>(UserController).toSelf().inRequestScope();

iocContainer.bind<AuthController>(AuthController).toSelf().inRequestScope();

iocContainer
    .bind<StudentController>(StudentController)
    .toSelf()
    .inRequestScope();

iocContainer.bind<FileController>(FileController).toSelf().inRequestScope();

export { iocContainer };
