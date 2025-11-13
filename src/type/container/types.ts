// src/type/container/types.ts

// --- Subsets of DI Symbols ---
/**
 * @description Symbols for all listener services.
 */
export const ListenerTypes = {
    IFileEventListener: Symbol.for("IFileEventListener"),
    IStudentEventListener: Symbol.for("IStudentEventListener"),
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
    IPredictionL1Service: Symbol.for("IPredictionL1Service"),
    IPredictionL2Service: Symbol.for("IPredictionL2Service"),
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
    StudentAptitudeExamRepository: Symbol.for("StudentAptitudeExamRepository"),
    StudentConductRepository: Symbol.for("StudentConductRepository"),
    StudentNationalExamRepository: Symbol.for("StudentNationalExamRepository"),
    StudentRepository: Symbol.for("StudentRepository"),
    StudentTalentExamRepository: Symbol.for("StudentTalentExamRepository"),
    StudentVsatExamRepository: Symbol.for("StudentVsatExamRepository"),
    UserRepository: Symbol.for("UserRepository"),
    VnuhcmScoreComponentRepository: Symbol.for(
        "VnuhcmScoreComponentRepository",
    ),
};

/**
 * @description Symbols for configuration objects.
 */
export const ConfigTypes = {
    ClientConfig: Symbol.for("ClientConfig"),
    CompressionOptions: Symbol.for("CompressionOptions"),
    DecompressionOptions: Symbol.for("DecompressionOptions"),
    IncompressibleMimeTypes: Symbol.for("IncompressibleMimeTypes"),
    LoggerConfig: Symbol.for("LoggerConfig"),
    MulterOptions: Symbol.for("MulterOptions"),
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
 * @description Symbols for utility.
 */
export const UtilityTypes = {
    ConcurrencyUtil: Symbol.for("ConcurrencyUtil"),
    PredictionUtil: Symbol.for("PredictionUtil"),
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
    ...UtilityTypes,
    ...InfrastructureTypes,
};
