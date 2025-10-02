// Define the configuration interface
export interface Config {
    ADMIN_EMAIL: string;
    ADMIN_NAME: string;
    ADMIN_PASSWORD: string;

    // Cache TTL Configuration
    CACHE_TTL_ADMISSION_FIELDS: number;

    // CORS Configuration
    CORS_CREDENTIALS: boolean;
    CORS_ORIGIN: string[];

    // Database connection settings
    DB_LOGGING: boolean;
    // Migration settings
    DB_RUN_MIGRATIONS_ON_STARTUP: boolean;

    DB_SYNCHRONIZE: boolean;

    // Logging settings
    ENABLE_FILE_LOGGING: boolean;
    // JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: number;

    JWT_REFRESH_TOKEN_EXPIRATION_IN_SECONDS: number;

    LOG_DIR: string;
    LOG_LEVEL: "debug" | "error" | "http" | "info" | "warn";

    // Mistral AI API Configuration
    MISTRAL_API_KEY: string;

    // Environment config
    NODE_ENV: "development" | "production" | "staging";
    // Pagination Configuration (Spring Boot style)
    PAGINATION_DEFAULT_PAGE: number;

    PAGINATION_DEFAULT_SIZE: number;
    PAGINATION_MAX_SIZE: number;
    PAGINATION_MIN_SIZE: number;
    // Database config
    POSTGRES_DB: string;
    POSTGRES_HOST: string;

    POSTGRES_PASSWORD: string;
    POSTGRES_PORT: number;

    POSTGRES_USER: string;
    // JWT RSA Keys
    PRIVATE_KEY_PATH: string;
    PUBLIC_KEY_PATH: string;
    // Redis configuration
    REDIS_DB: number;
    REDIS_HOST: string;
    REDIS_PASSWORD?: string;

    REDIS_PORT: number;
    REDIS_USER_PASSWORD?: string;

    REDIS_USERNAME?: string;

    // Application config
    SERVER_BATCH_CONCURRENCY: number;
    SERVER_HOSTNAME: string;
    SERVER_PATH: string;
    SERVER_PORT: number;

    // Predict model service config
    SERVICE_BATCH_CONCURRENCY: number;
    SERVICE_INPUTS_PER_WORKER: number;
    SERVICE_L1_CHUNK_DELAY_MS: number;
    SERVICE_L1_CHUNK_SIZE_INPUT_ARRAY: number;
    SERVICE_L2_CHUNK_DELAY_MS: number;
    SERVICE_L2_CHUNK_SIZE_INPUT_ARRAY: number;
    SERVICE_MAX_RETRIES: number;
    SERVICE_MIN_BATCH_CONCURRENCY: number;
    SERVICE_NETWORK_LATENCY_MS: number;
    SERVICE_PREDICTION_CONCURRENCY: number;
    SERVICE_REQUEST_DELAY_MS: number;
    SERVICE_RETRY_BASE_DELAY_MS: number;
    SERVICE_RETRY_ITERATION_DELAY_MS: number;
    SERVICE_SERVER_HOSTNAME: string;
    SERVICE_SERVER_PATH: string;
    SERVICE_SERVER_PORT: number;
    SERVICE_TIMEOUT_IN_MS: number;
}
