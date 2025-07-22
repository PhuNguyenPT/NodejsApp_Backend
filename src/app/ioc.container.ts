// src/app/ioc.container.ts
import { Container } from "inversify";

import { AuthController } from "@/controller/auth.controller";
import { UserController } from "@/controller/user.controller.js";
import { UserRepository } from "@/repository/impl/user.repository.js";
import { IUserRepository } from "@/repository/user.repository.interface.js";
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
    .bind<IUserRepository>(TYPES.UserRepository)
    .to(UserRepository)
    .inSingletonScope();

iocContainer
    .bind<UserService>(TYPES.UserService)
    .to(UserService)
    .inSingletonScope();

iocContainer.bind<KeyStore>(TYPES.KeyStore).to(KeyStore).inSingletonScope();

iocContainer.bind<UserController>(UserController).toSelf().inRequestScope();
iocContainer.bind<AuthController>(AuthController).toSelf().inRequestScope();

export { iocContainer };
