import { createWinstonLogger, type LoggerConfig } from "@/util/logger.js";
import { config } from "@/util/validate-env.js";

export const loggerConfig: LoggerConfig = {
    enableFileLogging: config.ENABLE_FILE_LOGGING,
    isProduction: config.NODE_ENV === "production",
    logDir: config.LOG_DIR,
    logLevel: config.LOG_LEVEL,
};

export const logger = createWinstonLogger(loggerConfig);
