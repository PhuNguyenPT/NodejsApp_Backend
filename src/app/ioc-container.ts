// src/app/ioc-container.ts
import { AxiosInstance } from "axios";
import { Container } from "inversify";
import { RedisClientType } from "redis";
import { DataSource, Repository } from "typeorm";
import { Logger } from "winston";

import { postgresDataSource } from "@/config/data-source.config.js";
import { logger } from "@/config/logger.config.js";
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
import { JwtTokenRepository } from "@/repository/impl/jwt-repository.js";
import { UserRepository } from "@/repository/impl/user-repository.js";
import { IJwtTokenRepository } from "@/repository/jwt-token-repository-interface.js";
import { IUserRepository } from "@/repository/user-repository-interface.js";
import { IAdmissionService } from "@/service/admission-service.interface.js";
import { IAuthService } from "@/service/auth-service.interface.js";
import { IAwardService } from "@/service/award-service.interface.js";
import { ICertificationService } from "@/service/certification-service.interface.js";
import { IFileService } from "@/service/file-service.interface.js";
import { AdmissionService } from "@/service/impl/admission.service.js";
import { AuthService } from "@/service/impl/auth.service.js";
import { AwardService } from "@/service/impl/award.service.js";
import { CertificationService } from "@/service/impl/certification.service.js";
import { FileService } from "@/service/impl/file.service.js";
import { JwtService } from "@/service/impl/jwt.service.js";
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
import { IJwtService } from "@/service/jwt-service.interface.js";
import { IMajorService } from "@/service/major-service.interface.js";
import { IMistralService } from "@/service/mistral-service.interface.js";
import { IOcrResultService } from "@/service/ocr-result-service.interface.js";
import { IPredictionModelService } from "@/service/prediction-model-service.interface.js";
import { IPredictionResultService } from "@/service/prediction-result-service.interface.js";
import { IStudentService } from "@/service/student-service.interface.js";
import { IUserService } from "@/service/user-service.interface.js";
import { KeyStore } from "@/type/class/keystore.js";
import {
    ClientConfig,
    PredictionServiceClient,
} from "@/type/class/prediction-service.client.js";
import { TYPES } from "@/type/container/types.js";

const iocContainer = new Container();

// --- Core & Infrastructure Bindings ---
iocContainer
    .bind<Container>(TYPES.InversifyContainer)
    .toConstantValue(iocContainer);
iocContainer.bind<Logger>(TYPES.Logger).toConstantValue(logger);
iocContainer
    .bind<DataSource>(TYPES.DataSource)
    .toConstantValue(postgresDataSource);
iocContainer
    .bind<RedisClientType>(TYPES.RedisPublisher)
    .toConstantValue(redisClient);
iocContainer
    .bind<RedisClientType>(TYPES.RedisSubscriber)
    .toConstantValue(redisSubscriber);
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
iocContainer.bind<KeyStore>(TYPES.KeyStore).to(KeyStore).inSingletonScope();

// --- Configuration Bindings ---
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

// --- Repository Bindings ---
iocContainer
    .bind<IUserRepository>(TYPES.IUserRepository)
    .to(UserRepository)
    .inSingletonScope();
iocContainer
    .bind<IJwtTokenRepository>(TYPES.IJwtTokenRepository)
    .to(JwtTokenRepository)
    .inSingletonScope();
iocContainer
    .bind<Repository<UserEntity>>(TYPES.UserRepository)
    .toConstantValue(postgresDataSource.getRepository(UserEntity));
iocContainer
    .bind<Repository<StudentEntity>>(TYPES.StudentRepository)
    .toConstantValue(postgresDataSource.getRepository(StudentEntity));
iocContainer
    .bind<Repository<AwardEntity>>(TYPES.AwardRepository)
    .toConstantValue(postgresDataSource.getRepository(AwardEntity));
iocContainer
    .bind<Repository<CertificationEntity>>(TYPES.CertificationRepository)
    .toConstantValue(postgresDataSource.getRepository(CertificationEntity));
iocContainer
    .bind<Repository<FileEntity>>(TYPES.FileRepository)
    .toConstantValue(postgresDataSource.getRepository(FileEntity));
iocContainer
    .bind<Repository<MajorGroupEntity>>(TYPES.MajorGroupRepository)
    .toConstantValue(postgresDataSource.getRepository(MajorGroupEntity));
iocContainer
    .bind<Repository<MajorEntity>>(TYPES.MajorRepository)
    .toConstantValue(postgresDataSource.getRepository(MajorEntity));
iocContainer
    .bind<Repository<OcrResultEntity>>(TYPES.OcrResultRepository)
    .toConstantValue(postgresDataSource.getRepository(OcrResultEntity));
iocContainer
    .bind<
        Repository<PredictionResultEntity>
    >(TYPES.PredictionResultEntityRepository)
    .toConstantValue(postgresDataSource.getRepository(PredictionResultEntity));
iocContainer
    .bind<Repository<AdmissionEntity>>(TYPES.AdmissionRepository)
    .toConstantValue(postgresDataSource.getRepository(AdmissionEntity));

// --- Service Bindings ---
iocContainer
    .bind<IUserService>(TYPES.IUserService)
    .to(UserService)
    .inSingletonScope();
iocContainer
    .bind<IJwtService>(TYPES.IJwtService)
    .to(JwtService)
    .inSingletonScope();
iocContainer
    .bind<IAuthService>(TYPES.IAuthService)
    .to(AuthService)
    .inSingletonScope();
iocContainer
    .bind<IAwardService>(TYPES.IAwardService)
    .to(AwardService)
    .inSingletonScope();
iocContainer
    .bind<ICertificationService>(TYPES.ICertificationService)
    .to(CertificationService)
    .inSingletonScope();
iocContainer
    .bind<IFileService>(TYPES.IFileService)
    .to(FileService)
    .inSingletonScope();
iocContainer
    .bind<IStudentService>(TYPES.IStudentService)
    .to(StudentService)
    .inSingletonScope();
iocContainer
    .bind<IMajorService>(TYPES.IMajorService)
    .to(MajorService)
    .inSingletonScope();
iocContainer
    .bind<IMistralService>(TYPES.IMistralService)
    .to(MistralService)
    .inSingletonScope();
iocContainer
    .bind<IOcrResultService>(TYPES.IOcrResultService)
    .to(OcrResultService)
    .inSingletonScope();
iocContainer
    .bind<IPredictionModelService>(TYPES.IPredictionModelService)
    .to(PredictionModelService)
    .inSingletonScope();
iocContainer
    .bind<IPredictionResultService>(TYPES.IPredictionResultService)
    .to(PredictionResultService)
    .inSingletonScope();
iocContainer
    .bind<IAdmissionService>(TYPES.IAdmissionService)
    .to(AdmissionService)
    .inSingletonScope();

// --- Event Listener Bindings ---
iocContainer
    .bind<OcrEventListenerService>(TYPES.OcrEventListenerService)
    .to(OcrEventListenerService)
    .inSingletonScope();
iocContainer
    .bind<PredictionModelEventListenerService>(
        TYPES.PredictionModelEventListenerService,
    )
    .to(PredictionModelEventListenerService)
    .inSingletonScope();

// ############## --- Job Bindings --- ##############
iocContainer
    .bind<TokenCleanupJob>(TYPES.TokenCleanupJob)
    .to(TokenCleanupJob)
    .inSingletonScope();

// ############## --- Controller Bindings --- ##############
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

export { iocContainer };
