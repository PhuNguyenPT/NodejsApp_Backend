// src/app/ioc.container.ts
import { Container } from "inversify";

import { UserController } from "@/controller/user.controller.js";
import { UserRepository } from "@/repository/impl/user.repository.js";
import { IUserRepository } from "@/repository/user.repository.interface.js";
import { UserService } from "@/service/user.service.js";
import { TYPES } from "@/type/container/types.js";
import { ILogger } from "@/type/interface/logger.js";
import { WinstonLoggerService } from "@/util/logger.js";

const iocContainer = new Container();

// Bind logger with proper typing
iocContainer
    .bind<ILogger>(TYPES.Logger)
    .to(WinstonLoggerService)
    .inSingletonScope();

// Bind repositories
iocContainer.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);

// Bind services
iocContainer.bind<UserService>(TYPES.UserService).to(UserService);

iocContainer.bind<UserController>(UserController).toSelf().inRequestScope();

export { iocContainer };
