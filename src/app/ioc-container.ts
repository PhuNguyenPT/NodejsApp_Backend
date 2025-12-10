// src/app/ioc-container.ts
import { AxiosInstance } from "axios";
import { Container } from "inversify";
import { Options } from "multer";
import { RedisClientType } from "redis";
import { DataSource, Repository } from "typeorm";
import { Logger } from "winston";
import { ZlibOptions } from "zlib";

import AbstractApp from "@/app/app.abstract.js";
import App from "@/app/app.js";
import { Config } from "@/config/app.config.js";
import { postgresDataSource } from "@/config/data-source.config.js";
import { mutterOptions } from "@/config/file.config.js";
import { logger } from "@/config/logger.config.js";
import { PassportConfig } from "@/config/passport.config.js";
import {
    PredictionModelServiceConfig,
    predictionModelServiceConfig,
    predictionServiceClientConfig,
} from "@/config/prediction-model.config.js";
import { redisClient, redisSubscriber } from "@/config/redis.config.js";
import {
    COMPRESSION_OPTIONS,
    DECOMPRESSION_OPTIONS,
    INCOMPRESSIBLE_MIME_TYPES,
} from "@/config/zlib.config.js";
import { AdmissionController } from "@/controller/admission.controller.js";
import { AuthController } from "@/controller/auth.controller.js";
import { FileController } from "@/controller/file.controller.js";
import { OcrController } from "@/controller/ocr.controller.js";
import { PredictionController } from "@/controller/prediction.controller.js";
import { StudentController } from "@/controller/student.controller.js";
import { UserController } from "@/controller/user.controller.js";
import { UserEntity } from "@/entity/security/user.entity.js";
import { AcademicPerformanceEntity } from "@/entity/uni_guide/academic-performance.entity.js";
import { AdmissionEntity } from "@/entity/uni_guide/admission.entity.js";
import { AptitudeExamEntity } from "@/entity/uni_guide/aptitude-exam.entity.js";
import { AwardEntity } from "@/entity/uni_guide/award.entity.js";
import { CertificationEntity } from "@/entity/uni_guide/certification.entity.js";
import { ConductEntity } from "@/entity/uni_guide/conduct.entity.js";
import { FileEntity } from "@/entity/uni_guide/file.entity.js";
import { MajorGroupEntity } from "@/entity/uni_guide/major-group.entity.js";
import { MajorEntity } from "@/entity/uni_guide/major.entity.js";
import { NationalExamEntity } from "@/entity/uni_guide/national-exam.enity.js";
import { OcrResultEntity } from "@/entity/uni_guide/ocr-result.entity.js";
import { PredictionResultEntity } from "@/entity/uni_guide/prediction-result.entity.js";
import { StudentMajorGroupEntity } from "@/entity/uni_guide/student-major-group.entity.js";
import { StudentEntity } from "@/entity/uni_guide/student.entity.js";
import { TalentExamEntity } from "@/entity/uni_guide/talent-exam.entity.js";
import { TranscriptSubjectEntity } from "@/entity/uni_guide/transcript-subject.entity.js";
import { TranscriptEntity } from "@/entity/uni_guide/transcript.entity.js";
import { VnuhcmScoreComponentEntity } from "@/entity/uni_guide/vnuhcm-score-component.entity.js";
import { VsatExamEntity } from "@/entity/uni_guide/vsat-exam.entity.js";
import { IFileEventListener } from "@/event/file-event-listener.interface.js";
import { FileEventListener } from "@/event/impl/file-event-listener.js";
import { OcrEventListener } from "@/event/impl/ocr-event-listener.js";
import { StudentEventListener } from "@/event/impl/student-event-listener.js";
import { TranscriptEventListener } from "@/event/impl/transcript-event-listener.js";
import { IOcrEventListener } from "@/event/ocr-event-listener.interface.js";
import { IStudentEventListener } from "@/event/student-event-listener.interface.js";
import { ITranscriptEventListener } from "@/event/transcript-event-listener.interface.js";
import { DatabaseManager } from "@/manager/database.manager.js";
import { LifecycleManager } from "@/manager/lifecycle.manager.js";
import { MiddlewareManager } from "@/manager/middleware.manager.js";
import { RouteManager } from "@/manager/route.manager.js";
import { ServerManager } from "@/manager/server.manager.js";
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
import { PredictionL1Service } from "@/service/impl/prediction-L1.service.js";
import { PredictionL2Service } from "@/service/impl/prediction-L2.service.js";
import { PredictionL3Service } from "@/service/impl/prediction-L3.service.js";
import { PredictionL3ProcessorService } from "@/service/impl/prediction-response-processor.service.js";
import { PredictionResultService } from "@/service/impl/prediction-result.service.js";
import { StudentService } from "@/service/impl/student.service.js";
import { TranscriptService } from "@/service/impl/transcript.service.js";
import { UserService } from "@/service/impl/user.service.js";
import { IJwtService } from "@/service/jwt-service.interface.js";
import { IMajorService } from "@/service/major-service.interface.js";
import { IMistralService } from "@/service/mistral-service.interface.js";
import { IOcrResultService } from "@/service/ocr-result-service.interface.js";
import { IPredictionL1Service } from "@/service/prediction-l1-service.interface.js";
import { IPredictionL2Service } from "@/service/prediction-l2-service.interface.js";
import { IPredictionL3Service } from "@/service/prediction-L3-service.interface.js";
import { IPredictionL3ProcessorService } from "@/service/prediction-response-processor-service.interface.js";
import { IPredictionResultService } from "@/service/prediction-result-service.interface.js";
import { IStudentService } from "@/service/student-service.interface.js";
import { ITranscriptService } from "@/service/transcript-service.interface.js";
import { IUserService } from "@/service/user-service.interface.js";
import { KeyStore } from "@/type/class/keystore.js";
import {
    ClientConfig,
    PredictionServiceClient,
} from "@/type/class/prediction-service.client.js";
import { TYPES } from "@/type/container/types.js";
import { ConcurrencyUtil } from "@/util/concurrency.util.js";
import { PredictionUtil } from "@/util/prediction.util.js";
import { config } from "@/util/validate-env.js";

const iocContainer = new Container();

// --- Core & Infrastructure Bindings ---
iocContainer.bind<AbstractApp>(TYPES.App).to(App).inSingletonScope();
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

// --- Manager Bindings ---
iocContainer
    .bind<DatabaseManager>(TYPES.DatabaseManager)
    .to(DatabaseManager)
    .inSingletonScope();

iocContainer
    .bind<ServerManager>(TYPES.ServerManager)
    .to(ServerManager)
    .inSingletonScope();

iocContainer
    .bind<MiddlewareManager>(TYPES.MiddlewareManager)
    .to(MiddlewareManager)
    .inSingletonScope();

iocContainer
    .bind<RouteManager>(TYPES.RouteManager)
    .to(RouteManager)
    .inSingletonScope();

iocContainer
    .bind<LifecycleManager>(TYPES.LifecycleManager)
    .to(LifecycleManager)
    .inSingletonScope();

// --- Configuration Bindings ---
iocContainer.bind<Config>(TYPES.Config).toConstantValue(config);
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
iocContainer
    .bind<ZlibOptions>(TYPES.CompressionOptions)
    .toConstantValue(COMPRESSION_OPTIONS);
iocContainer
    .bind<ZlibOptions>(TYPES.DecompressionOptions)
    .toConstantValue(DECOMPRESSION_OPTIONS);
iocContainer
    .bind<Set<string>>(TYPES.IncompressibleMimeTypes)
    .toConstantValue(INCOMPRESSIBLE_MIME_TYPES);
iocContainer.bind<Options>(TYPES.MulterOptions).toConstantValue(mutterOptions);

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
    .bind<
        Repository<AcademicPerformanceEntity>
    >(TYPES.AcademicPerformanceRepository)
    .toConstantValue(
        postgresDataSource.getRepository(AcademicPerformanceEntity),
    );
iocContainer
    .bind<Repository<AptitudeExamEntity>>(TYPES.AptitudeExamRepository)
    .toConstantValue(postgresDataSource.getRepository(AptitudeExamEntity));
iocContainer
    .bind<
        Repository<VnuhcmScoreComponentEntity>
    >(TYPES.VnuhcmScoreComponentRepository)
    .toConstantValue(
        postgresDataSource.getRepository(VnuhcmScoreComponentEntity),
    );
iocContainer
    .bind<Repository<AwardEntity>>(TYPES.AwardRepository)
    .toConstantValue(postgresDataSource.getRepository(AwardEntity));
iocContainer
    .bind<Repository<CertificationEntity>>(TYPES.CertificationRepository)
    .toConstantValue(postgresDataSource.getRepository(CertificationEntity));
iocContainer
    .bind<Repository<ConductEntity>>(TYPES.ConductRepository)
    .toConstantValue(postgresDataSource.getRepository(ConductEntity));
iocContainer
    .bind<Repository<FileEntity>>(TYPES.FileRepository)
    .toConstantValue(postgresDataSource.getRepository(FileEntity));
iocContainer
    .bind<Repository<MajorGroupEntity>>(TYPES.MajorGroupRepository)
    .toConstantValue(postgresDataSource.getRepository(MajorGroupEntity));
iocContainer
    .bind<
        Repository<StudentMajorGroupEntity>
    >(TYPES.StudentMajorGroupRepository)
    .toConstantValue(postgresDataSource.getRepository(StudentMajorGroupEntity));
iocContainer
    .bind<Repository<MajorEntity>>(TYPES.MajorRepository)
    .toConstantValue(postgresDataSource.getRepository(MajorEntity));
iocContainer
    .bind<Repository<NationalExamEntity>>(TYPES.NationalExamRepository)
    .toConstantValue(postgresDataSource.getRepository(NationalExamEntity));
iocContainer
    .bind<Repository<TalentExamEntity>>(TYPES.TalentExamRepository)
    .toConstantValue(postgresDataSource.getRepository(TalentExamEntity));
iocContainer
    .bind<Repository<VsatExamEntity>>(TYPES.VsatExamRepository)
    .toConstantValue(postgresDataSource.getRepository(VsatExamEntity));
iocContainer
    .bind<Repository<OcrResultEntity>>(TYPES.OcrResultRepository)
    .toConstantValue(postgresDataSource.getRepository(OcrResultEntity));
iocContainer
    .bind<
        Repository<TranscriptSubjectEntity>
    >(TYPES.TranscriptSubjectRepository)
    .toConstantValue(postgresDataSource.getRepository(TranscriptSubjectEntity));
iocContainer
    .bind<Repository<TranscriptEntity>>(TYPES.TranscriptRepository)
    .toConstantValue(postgresDataSource.getRepository(TranscriptEntity));
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
    .bind<ITranscriptService>(TYPES.ITranscriptService)
    .to(TranscriptService)
    .inSingletonScope();
iocContainer
    .bind<IPredictionResultService>(TYPES.IPredictionResultService)
    .to(PredictionResultService)
    .inSingletonScope();
iocContainer
    .bind<IPredictionL1Service>(TYPES.IPredictionL1Service)
    .to(PredictionL1Service)
    .inSingletonScope();
iocContainer
    .bind<IPredictionL2Service>(TYPES.IPredictionL2Service)
    .to(PredictionL2Service)
    .inSingletonScope();
iocContainer
    .bind<IPredictionL3Service>(TYPES.IPredictionL3Service)
    .to(PredictionL3Service)
    .inSingletonScope();
iocContainer
    .bind<IAdmissionService>(TYPES.IAdmissionService)
    .to(AdmissionService)
    .inSingletonScope();
iocContainer
    .bind<IPredictionL3ProcessorService>(TYPES.IPredictionL3ProcessorService)
    .to(PredictionL3ProcessorService)
    .inSingletonScope();
// --- Utility Bindings ---
iocContainer
    .bind<PredictionUtil>(TYPES.PredictionUtil)
    .to(PredictionUtil)
    .inSingletonScope();
iocContainer
    .bind<ConcurrencyUtil>(TYPES.ConcurrencyUtil)
    .to(ConcurrencyUtil)
    .inSingletonScope();

// --- Event Listener Bindings ---
iocContainer
    .bind<IFileEventListener>(TYPES.IFileEventListener)
    .to(FileEventListener)
    .inSingletonScope();
iocContainer
    .bind<IStudentEventListener>(TYPES.IStudentEventListener)
    .to(StudentEventListener)
    .inSingletonScope();
iocContainer
    .bind<IOcrEventListener>(TYPES.IOcrEventListener)
    .to(OcrEventListener)
    .inSingletonScope();
iocContainer
    .bind<ITranscriptEventListener>(TYPES.ITranscriptEventListener)
    .to(TranscriptEventListener)
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
