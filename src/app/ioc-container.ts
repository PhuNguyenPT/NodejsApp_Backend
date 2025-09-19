// src/app/ioc-container.ts
import { AxiosInstance } from "axios";
import { Container } from "inversify";
import { RedisClientType } from "redis";
import { DataSource, Repository } from "typeorm";

import { postgresDataSource } from "@/config/data-source.config.js";
import { loggerConfig } from "@/config/logger.config.js";
import { PassportConfig } from "@/config/passport.config.js";
import {
    predictionModelServiceConfig,
    predictionServiceClientConfig,
} from "@/config/prediction-model.config.js";
import { redisClient, redisSubscriber } from "@/config/redis.config.js";
import { AdmissionController } from "@/controller/admission.controller.js";
import { AuthController } from "@/controller/auth.controller.js";
import { FileController } from "@/controller/file.controller.js";
import { OcrController } from "@/controller/ocr.controller.js";
import { PredictionController } from "@/controller/prediction.controller.js";
import { StudentController } from "@/controller/student.controller.js";
import { UserController } from "@/controller/user.controller.js";
import { AdmissionEntity } from "@/entity/admission.entity.js";
import { AwardEntity } from "@/entity/award.entity.js";
import { CertificationEntity } from "@/entity/certification.entity.js";
import { FileEntity } from "@/entity/file.entity.js";
import { MajorGroupEntity } from "@/entity/major-group.entity.js";
import { MajorEntity } from "@/entity/major.entity.js";
import { OcrResultEntity } from "@/entity/ocr-result.entity.js";
import { PredictionResultEntity } from "@/entity/prediction-result.entity.js";
import { StudentEntity } from "@/entity/student.entity.js";
import { UserEntity } from "@/entity/user.entity.js";
import { OcrEventListenerService } from "@/event/orc-event-listener.service.js";
import { PredictionModelEventListenerService } from "@/event/prediction-model-event-listener.service.js";
import { TokenCleanupJob } from "@/job/token-cleanup-job.js";
import { EventListenerManager } from "@/manager/event-listener-manager.js";
import { JwtTokenRepository } from "@/repository/impl/jwt-repository.js";
import { UserRepository } from "@/repository/impl/user-repository.js";
import { IJwtTokenRepository } from "@/repository/jwt-token-repository-interface.js";
import { IUserRepository } from "@/repository/user-repository-interface.js";
import { AdmissionService } from "@/service/impl/admission.service.js";
import { AuthService } from "@/service/impl/auth.service.js";
import { AwardService } from "@/service/impl/award.service.js";
import { CertificationService } from "@/service/impl/certification.service.js";
import { FileService } from "@/service/impl/file.service.js";
import { JwtEntityService } from "@/service/impl/jwt-entity.service.js";
import { JWTService } from "@/service/impl/jwt.service.js";
import { MajorService } from "@/service/impl/major.service.js";
import { MistralService } from "@/service/impl/mistral.service.js";
import { OcrResultService } from "@/service/impl/ocr-result.service.js";
import {
    PredictionModelService,
    PredictionModelServiceConfig,
} from "@/service/impl/prediction-model.service.js";
import { PredictionResultService } from "@/service/impl/prediction-result.service.js";
import { StudentService } from "@/service/impl/student.service.js";
import { UserService } from "@/service/impl/user.service.js";
import { WinstonLoggerService } from "@/service/impl/winston-logger.service.js";
import { IPredictionModelService } from "@/service/prediction-model-service.interface.js";
import { KeyStore } from "@/type/class/keystore.js";
import {
    ClientConfig,
    PredictionServiceClient,
} from "@/type/class/prediction-service.client.js";
import { TYPES } from "@/type/container/types.js";
import { ILogger } from "@/type/interface/logger.interface.js";
import { LoggerConfig } from "@/util/logger.js";

const iocContainer = new Container();

iocContainer
    .bind<LoggerConfig>(TYPES.LoggerConfig)
    .toConstantValue(loggerConfig);

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
    .bind<Repository<PredictionResultEntity>>(
        TYPES.PredictionResultEntityRepository,
    )
    .toDynamicValue(() =>
        postgresDataSource.getRepository(PredictionResultEntity),
    )
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
    .bind<Repository<PredictionResultEntity>>(TYPES.PredictionResultRepository)
    .toDynamicValue(() =>
        postgresDataSource.getRepository(PredictionResultEntity),
    )
    .inSingletonScope();

iocContainer
    .bind<Repository<AdmissionEntity>>(TYPES.AdmissionRepository)
    .toDynamicValue(() => postgresDataSource.getRepository(AdmissionEntity))
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
    .bind<IPredictionModelService>(TYPES.IPredictionModelService)
    .to(PredictionModelService)
    .inSingletonScope();

iocContainer
    .bind<PredictionResultService>(TYPES.PredictionResultService)
    .to(PredictionResultService)
    .inSingletonScope();

iocContainer
    .bind<PredictionModelEventListenerService>(
        TYPES.PredictionModelEventListenerService,
    )
    .to(PredictionModelEventListenerService)
    .inSingletonScope();

iocContainer
    .bind<AdmissionService>(TYPES.AdmissionService)
    .to(AdmissionService)
    .inSingletonScope();

iocContainer
    .bind<PredictionServiceClient>(TYPES.PredictionServiceClient)
    .to(PredictionServiceClient)
    .inSingletonScope();

iocContainer
    .bind<AxiosInstance>(TYPES.PredictHttpClient)
    .toDynamicValue((context) => {
        const predictServer = context.get<PredictionServiceClient>(
            TYPES.PredictionServiceClient,
        );
        return predictServer.getHttpClient();
    })
    .inSingletonScope();

iocContainer
    .bind<PredictionModelServiceConfig>(TYPES.PredictionModelServiceConfig)
    .toConstantValue(predictionModelServiceConfig);

iocContainer
    .bind<ClientConfig>(TYPES.ClientConfig)
    .toConstantValue(predictionServiceClientConfig);

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
    .bind<PredictionController>(PredictionController)
    .toSelf()
    .inRequestScope();

iocContainer
    .bind<AdmissionController>(AdmissionController)
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

iocContainer
    .bind<Container>(TYPES.InversifyContainer)
    .toConstantValue(iocContainer);

iocContainer
    .bind<EventListenerManager>(TYPES.EventListenerManager)
    .to(EventListenerManager)
    .inSingletonScope();

iocContainer
    .bind<DataSource>(TYPES.DataSource)
    .toDynamicValue(() => postgresDataSource)
    .inSingletonScope();

export { iocContainer };
