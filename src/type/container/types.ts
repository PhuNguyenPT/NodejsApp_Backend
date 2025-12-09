// src/type/container/types.ts

// --- Subsets of DI Symbols ---
/**
 * @description Symbols for all listener services.
 */
export const ListenerTypes = {
    IFileEventListener: Symbol.for("IFileEventListener"),
    IOcrEventListener: Symbol.for("IOcrEventListener"),
    IStudentEventListener: Symbol.for("IStudentEventListener"),
    ITranscriptEventListener: Symbol.for("ITranscriptEventListener"),
};

/**
 * @description Symbols for all managers.
 */
export const ManagerTypes = {
    DatabaseManager: Symbol.for("DatabaseManager"),
    LifecycleManager: Symbol.for("LifecycleManager"),
    MiddlewareManager: Symbol.for("MiddlewareManager"),
    RouteManager: Symbol.for("RouteManager"),
    ServerManager: Symbol.for("ServerManager"),
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
    IPredictionL3ProcessorService: Symbol.for("IPredictionL3ProcessorService"),
    IPredictionL3Service: Symbol.for("IPredictionL3Service"),
    IPredictionModelService: Symbol.for("IPredictionModelService"),
    IPredictionResultService: Symbol.for("IPredictionResultService"),
    IStudentService: Symbol.for("IStudentService"),
    ITranscriptService: Symbol.for("ITranscriptService"),
    IUserService: Symbol.for("IUserService"),
};

/**
 * @description Symbols for all data repositories.
 */
export const RepositoryTypes = {
    AcademicPerformanceRepository: Symbol.for("AcademicPerformanceRepository"),
    AdmissionRepository: Symbol.for("AdmissionRepository"),
    AptitudeExamRepository: Symbol.for("AptitudeExamRepository"),
    AwardRepository: Symbol.for("AwardRepository"),
    CertificationRepository: Symbol.for("CertificationRepository"),
    ConductRepository: Symbol.for("ConductRepository"),
    FileRepository: Symbol.for("FileRepository"),
    IJwtTokenRepository: Symbol.for("IJwtTokenRepository"),
    IUserRepository: Symbol.for("IUserRepository"),
    MajorGroupRepository: Symbol.for("MajorGroupRepository"),
    MajorRepository: Symbol.for("MajorRepository"),
    NationalExamRepository: Symbol.for("NationalExamRepository"),
    OcrResultRepository: Symbol.for("OcrResultRepository"),
    PredictionResultEntityRepository: Symbol.for(
        "PredictionResultEntityRepository",
    ),
    StudentMajorGroupRepository: Symbol.for("StudentMajorGroupRepository"),
    StudentRepository: Symbol.for("StudentRepository"),
    TalentExamRepository: Symbol.for("TalentExamRepository"),
    TranscriptRepository: Symbol.for("TranscriptRepository"),
    TranscriptSubjectRepository: Symbol.for("TranscriptSubjectRepository"),
    UserRepository: Symbol.for("UserRepository"),
    VnuhcmScoreComponentRepository: Symbol.for(
        "VnuhcmScoreComponentRepository",
    ),
    VsatExamRepository: Symbol.for("VsatExamRepository"),
};

/**
 * @description Symbols for configuration objects.
 */
export const ConfigTypes = {
    ClientConfig: Symbol.for("ClientConfig"),
    CompressionOptions: Symbol.for("CompressionOptions"),
    Config: Symbol.for("Config"),
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
    App: Symbol.for("App"),
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
    ...ManagerTypes,
    ...ServiceTypes,
    ...RepositoryTypes,
    ...ConfigTypes,
    ...UtilityTypes,
    ...InfrastructureTypes,
};
