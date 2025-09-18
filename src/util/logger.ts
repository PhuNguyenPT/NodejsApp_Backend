import { injectable } from "inversify";
// src/util/logger.ts
import winston, { format, Logger, transports } from "winston";

import { ILogger } from "@/type/interface/logger.interface.js";
import { config } from "@/util/validate-env.js";

// Custom log levels
const logLevels = {
    debug: 4,
    error: 0,
    http: 3,
    info: 2,
    warn: 1,
};

// Custom colors for each level
const logColors = {
    debug: "white",
    error: "red",
    http: "magenta",
    info: "green",
    warn: "yellow",
};

// Tell winston about colors
winston.addColors(logColors);

// Use config for environment and log settings
const isProduction: boolean = config.NODE_ENV === "production";
const logLevel: string = config.LOG_LEVEL;
const logDir: string = config.LOG_DIR;
const enableFileLogging: boolean = config.ENABLE_FILE_LOGGING;

// Utility function for processing log metadata with array truncation
export function processLogMeta(
    meta: Record<string, unknown>,
    arrayTruncateOptions: { keys?: string[]; maxItems?: number } = {},
): Record<string, unknown> {
    const { keys, maxItems = 10 } = arrayTruncateOptions;

    if (typeof meta !== "object") {
        return meta;
    }

    const processed: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(meta)) {
        if (Array.isArray(value)) {
            // If specific keys are provided, only truncate those keys
            if (keys && keys.length > 0) {
                processed[key] = keys.includes(key)
                    ? truncateArray(value, maxItems)
                    : value;
            } else {
                // Truncate all arrays
                processed[key] = truncateArray(value, maxItems);
            }
        } else {
            processed[key] = value;
        }
    }

    return processed;
}

// Utility function for truncating arrays in logs
export function truncateArray<T>(array: T[], maxItems = 10): (string | T)[] {
    if (!Array.isArray(array) || array.length <= maxItems) {
        return array;
    }

    const visibleItems = array.slice(0, maxItems);
    const remainingCount = array.length - maxItems;
    return [...visibleItems, `...and ${remainingCount.toString()} more`];
}

// Custom format for development with metadata support and array truncation
const developmentFormat = format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    format.colorize({ all: true }),
    format.printf((info) => {
        const { level, message, timestamp, ...meta } = info;

        // Base log message
        let logMessage = `${String(timestamp)} ${level}: ${String(message)}`;

        // Process metadata with array truncation
        const processedMeta = processLogMeta(meta, { maxItems: 12 });

        // Add metadata if it exists
        if (Object.keys(processedMeta).length > 0) {
            logMessage += ` ${JSON.stringify(processedMeta, null, 2)}`;
        }

        return logMessage;
    }),
);

// Custom format for production with array truncation
const productionFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf((info) => {
        const { level, message, timestamp, ...meta } = info;

        // Process metadata with array truncation
        const processedMeta = processLogMeta(meta, { maxItems: 12 });

        return JSON.stringify({
            level,
            message,
            timestamp,
            ...processedMeta,
        });
    }),
);

// Create transports array
const loggerTransports: winston.transport[] = [
    new transports.Console({
        format: isProduction ? productionFormat : developmentFormat,
    }),
];

// Add file transports based on configuration
if (enableFileLogging || isProduction) {
    loggerTransports.push(
        new transports.File({
            filename: `${logDir}/error.log`,
            format: productionFormat,
            level: "error",
            maxFiles: 5,
            maxsize: 5242880, // 5MB
        }),
        new transports.File({
            filename: `${logDir}/combined.log`,
            format: productionFormat,
            maxFiles: 5,
            maxsize: 5242880, // 5MB
        }),
    );
}

// Create winston logger instance
const logger = winston.createLogger({
    exceptionHandlers:
        enableFileLogging || isProduction
            ? [
                  new transports.File({
                      filename: `${logDir}/exceptions.log`,
                      maxFiles: 5,
                      maxsize: 5242880,
                  }),
              ]
            : [],
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
    ),
    level: logLevel,
    levels: logLevels,
    rejectionHandlers:
        enableFileLogging || isProduction
            ? [
                  new transports.File({
                      filename: `${logDir}/rejections.log`,
                      maxFiles: 5,
                      maxsize: 5242880,
                  }),
              ]
            : [],
    transports: loggerTransports,
});

// Enhanced wrapper class that implements ILogger interface with truncation support
@injectable()
export class WinstonLoggerService implements ILogger {
    private readonly logger: Logger;

    constructor() {
        this.logger = logger;
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(message, meta);
    }

    // New methods with explicit truncation control
    debugWithTruncation(
        message: string,
        meta?: Record<string, unknown>,
        truncateOptions?: { keys?: string[]; maxItems?: number },
    ): void {
        const processedMeta = meta
            ? processLogMeta(meta, truncateOptions)
            : meta;
        this.logger.debug(message, processedMeta);
    }

    error(message: string, meta?: Record<string, unknown>): void {
        this.logger.error(message, meta);
    }

    http(message: string, meta?: Record<string, unknown>): void {
        this.logger.http(message, meta);
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(message, meta);
    }

    infoWithTruncation(
        message: string,
        meta?: Record<string, unknown>,
        truncateOptions?: { keys?: string[]; maxItems?: number },
    ): void {
        const processedMeta = meta
            ? processLogMeta(meta, truncateOptions)
            : meta;
        this.logger.info(message, processedMeta);
    }

    // Helper method for manual metadata processing
    processMetadata(
        meta: Record<string, unknown>,
        options?: { keys?: string[]; maxItems?: number },
    ): Record<string, unknown> {
        return processLogMeta(meta, options);
    }

    // Utility method to truncate arrays manually
    truncateArray<T>(array: T[], maxItems = 10): (string | T)[] {
        return truncateArray(array, maxItems);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(message, meta);
    }
}

export default logger;
