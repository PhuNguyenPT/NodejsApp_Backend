// src/type/container/types.ts

// --- Subsets of DI Symbols ---
/**
 * @description Symbols for all listener services.
 */
export const ListenerTypes = {
    FileEventListener: Symbol.for("FileEventListener"),
    StudentEventListener: Symbol.for("StudentEventListener"),
};

/**
 * @description Symbols for all application services.
 */
export const ServiceTypes = {
    IAdmissionService: Symbol.for("IAdmissionService"),
    IAuthService: Symbol.for("IAuthService"),
    IAwardService: Symbol.for("IAwardService"),
    ICertificationService: Symbol.for("ICertificationService"),
    IFileService: Symbol.for("IFileService"),
    IJwtService: Symbol.for("IJwtService"),
    IMajorService: Symbol.for("IMajorService"),
    IMistralService: Symbol.for("IMistralService"),
    IOcrResultService: Symbol.for("IOcrResultService"),
    IPredictionModelService: Symbol.for("IPredictionModelService"),
    IPredictionResultService: Symbol.for("IPredictionResultService"),
    IStudentService: Symbol.for("IStudentService"),
    IUserService: Symbol.for("IUserService"),
};

/**
 * @description Symbols for all data repositories.
 */
export const RepositoryTypes = {
    AdmissionRepository: Symbol.for("AdmissionRepository"),
    AwardRepository: Symbol.for("AwardRepository"),
    CertificationRepository: Symbol.for("CertificationRepository"),
    FileRepository: Symbol.for("FileRepository"),
    IJwtTokenRepository: Symbol.for("IJwtTokenRepository"),
    IUserRepository: Symbol.for("IUserRepository"),
    MajorGroupRepository: Symbol.for("MajorGroupRepository"),
    MajorRepository: Symbol.for("MajorRepository"),
    OcrResultRepository: Symbol.for("OcrResultRepository"),
    PredictionResultEntityRepository: Symbol.for(
        "PredictionResultEntityRepository",
    ),
    StudentRepository: Symbol.for("StudentRepository"),
    UserRepository: Symbol.for("UserRepository"),
};

/**
 * @description Symbols for configuration objects.
 */
export const ConfigTypes = {
    ClientConfig: Symbol.for("ClientConfig"),
    LoggerConfig: Symbol.for("LoggerConfig"),
    PassportConfig: Symbol.for("PassportConfig"),
    PredictionModelServiceConfig: Symbol.for("PredictionModelServiceConfig"),
};

/**
 * @description Symbols for core infrastructure and clients.
 */
export const InfrastructureTypes = {
    DataSource: Symbol.for("DataSource"),
    InversifyContainer: Symbol.for("InversifyContainer"),
    KeyStore: Symbol.for("KeyStore"),
    Logger: Symbol.for("Logger"),
    PredictHttpClient: Symbol.for("PredictHttpClient"),
    PredictionServiceClient: Symbol.for("PredictionServiceClient"),
    RedisPublisher: Symbol.for("RedisPublisher"),
    RedisSubscriber: Symbol.for("RedisSubscriber"),
};

/**
 * @description Symbols for scheduled jobs or background tasks.
 */
export const JobTypes = {
    TokenCleanupJob: Symbol.for("TokenCleanupJob"),
};

// --- All Types Combined ---

/**
 * @description A single object containing all symbols, merged from the subsets.
 * This is useful for a central DI container configuration.
 */
export const TYPES = {
    ...ListenerTypes,
    ...ServiceTypes,
    ...RepositoryTypes,
    ...ConfigTypes,
    ...InfrastructureTypes,
    ...JobTypes,
};
