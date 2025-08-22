// src/app/ioc.container.ts
import { Container } from "inversify";
import { RedisClientType } from "redis";
import { Repository } from "typeorm";

import { postgresDataSource } from "@/config/data.source.js";
import { PassportConfig } from "@/config/passport.config.js";
import { redisClient, redisSubscriber } from "@/config/redis.js";
import { AuthController } from "@/controller/auth.controller.js";
import { FileController } from "@/controller/file.controller.js";
import { OcrController } from "@/controller/ocr.controller.js";
import { PredictController } from "@/controller/predict.controller.js";
import { StudentController } from "@/controller/student.controller.js";
import { UserController } from "@/controller/user.controller.js";
import { AwardEntity } from "@/entity/award.js";
import { CertificationEntity } from "@/entity/certification.js";
import { FileEntity } from "@/entity/file.js";
import { MajorEntity } from "@/entity/major.entity.js";
import { MajorGroupEntity } from "@/entity/major.group.entity.js";
import { OcrResultEntity } from "@/entity/ocr.result.entity.js";
import { StudentEntity } from "@/entity/student.js";
import { UserEntity } from "@/entity/user.js";
import { OcrEventListenerService } from "@/event/orc.event.listener.service.js";
import { TokenCleanupJob } from "@/job/token.cleanup.job.js";
import { JwtTokenRepository } from "@/repository/impl/jwt.repository.js";
import { UserRepository } from "@/repository/impl/user.repository.js";
import { IJwtTokenRepository } from "@/repository/jwt.token.repository.interface.js";
import { IUserRepository } from "@/repository/user.repository.interface.js";
import { AuthService } from "@/service/auth.service.js";
import { AwardService } from "@/service/award.service.js";
import { CertificationService } from "@/service/certification.service.js";
import { FileService } from "@/service/file.service.js";
import { JwtEntityService } from "@/service/jwt.entity.service.js";
import { JWTService } from "@/service/jwt.service.js";
import { MajorService } from "@/service/major.service.js";
import { MistralService } from "@/service/mistral.service.js";
import { OcrResultService } from "@/service/ocr.result.service.js";
import { PredictModelService } from "@/service/predic.model.service.js";
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
    .toDynamicValue(() => postgresDataSource.getRepository(StudentEntity))
    .inSingletonScope();

iocContainer
    .bind<Repository<AwardEntity>>(TYPES.AwardRepository)
    .toDynamicValue(() => postgresDataSource.getRepository(AwardEntity))
    .inSingletonScope();

iocContainer
    .bind<Repository<CertificationEntity>>(TYPES.CertificationRepository)
    .toDynamicValue(() => postgresDataSource.getRepository(CertificationEntity))
    .inSingletonScope();

iocContainer
    .bind<Repository<UserEntity>>(TYPES.UserRepository)
    .toDynamicValue(() => postgresDataSource.getRepository(UserEntity))
    .inSingletonScope();

iocContainer
    .bind<Repository<FileEntity>>(TYPES.FileRepository)
    .toDynamicValue(() => postgresDataSource.getRepository(FileEntity))
    .inSingletonScope();

iocContainer
    .bind<Repository<MajorGroupEntity>>(TYPES.MajorGroupRepository)
    .toDynamicValue(() => postgresDataSource.getRepository(MajorGroupEntity))
    .inSingletonScope();

iocContainer
    .bind<Repository<MajorEntity>>(TYPES.MajorRepository)
    .toDynamicValue(() => postgresDataSource.getRepository(MajorEntity))
    .inSingletonScope();

iocContainer
    .bind<IJwtTokenRepository>(TYPES.IJwtTokenRepository)
    .to(JwtTokenRepository)
    .inSingletonScope();

iocContainer
    .bind<Repository<OcrResultEntity>>(TYPES.OcrResultRepository)
    .toDynamicValue(() => postgresDataSource.getRepository(OcrResultEntity))
    .inSingletonScope();

iocContainer
    .bind<JwtEntityService>(TYPES.JwtEntityService)
    .to(JwtEntityService)
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
    .bind<AwardService>(TYPES.AwardService)
    .to(AwardService)
    .inSingletonScope();

iocContainer
    .bind<CertificationService>(TYPES.CertificationService)
    .to(CertificationService)
    .inSingletonScope();

iocContainer
    .bind<FileService>(TYPES.FileService)
    .to(FileService)
    .inSingletonScope();

iocContainer
    .bind<StudentService>(TYPES.StudentService)
    .to(StudentService)
    .inSingletonScope();

iocContainer
    .bind<MajorService>(TYPES.MajorService)
    .to(MajorService)
    .inSingletonScope();

iocContainer
    .bind<MistralService>(TYPES.MistralService)
    .to(MistralService)
    .inSingletonScope();

iocContainer
    .bind<OcrEventListenerService>(TYPES.OcrEventListenerService)
    .to(OcrEventListenerService)
    .inSingletonScope();

iocContainer
    .bind<OcrResultService>(TYPES.OcrResultService)
    .to(OcrResultService)
    .inSingletonScope();

iocContainer
    .bind<PredictModelService>(TYPES.PredictModelService)
    .to(PredictModelService)
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

iocContainer.bind<OcrController>(OcrController).toSelf().inRequestScope();

iocContainer
    .bind<PredictController>(PredictController)
    .toSelf()
    .inRequestScope();

iocContainer
    .bind<TokenCleanupJob>(TYPES.TokenCleanupJob)
    .to(TokenCleanupJob)
    .inSingletonScope();

iocContainer
    .bind<RedisClientType>(TYPES.RedisPublisher)
    .toConstantValue(redisClient);

iocContainer
    .bind<RedisClientType>(TYPES.RedisSubscriber)
    .toConstantValue(redisSubscriber);

export { iocContainer };
