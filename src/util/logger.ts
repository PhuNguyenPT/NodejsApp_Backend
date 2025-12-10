import type Transport from "winston-transport";

import {
    addColors,
    createLogger,
    format,
    type Logger,
    type LoggerOptions,
    transports,
} from "winston";

// Configuration interface for logger options
export interface LoggerConfig {
    enableFileLogging: boolean;
    isProduction: boolean;
    logDir: string;
    logLevel: string;
}

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
addColors(logColors);

// Simple factory function using winston.createLogger
export function createWinstonLogger(loggerConfig: LoggerConfig): Logger {
    const options = createLoggerOptions(loggerConfig);
    return createLogger(options);
}

// Simple function to create logger options
function createLoggerOptions(loggerConfig: LoggerConfig): LoggerOptions {
    const { enableFileLogging, isProduction, logDir, logLevel } = loggerConfig;

    // Development format - more readable
    const developmentFormat = format.combine(
        format.errors({ stack: true }),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
        format.colorize({ all: true }),
        format.printf(({ level, message, stack, timestamp, ...meta }) => {
            // Type-safe string conversion
            const timestampStr = String(timestamp);
            const messageStr = String(message);

            let logMessage = `${timestampStr} ${level}: ${messageStr}`;

            if (stack && typeof stack === "string") {
                logMessage += `\n${stack}`;
            }

            // Add metadata if present - filter out winston internals
            const metaKeys = Object.keys(meta).filter(
                (key) => !["level", "message", "timestamp"].includes(key),
            );
            if (metaKeys.length > 0) {
                const cleanMeta = metaKeys.reduce<Record<string, unknown>>(
                    (acc, key) => {
                        acc[key] = meta[key];
                        return acc;
                    },
                    {},
                );
                logMessage += `\n${JSON.stringify(cleanMeta, null, 2)}`;
            }

            return logMessage;
        }),
    );

    // Production format - structured JSON (NO COLORS)
    const productionFormat = format.combine(
        format.errors({ stack: true }),
        format.timestamp(),
        format.json(),
    );

    // Create transports array
    const loggerTransports: Transport[] = [
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
                tailable: true, // Better for log rotation
            }),
            new transports.File({
                filename: `${logDir}/combined.log`,
                format: productionFormat,
                maxFiles: 5,
                maxsize: 5242880, // 5MB
                tailable: true,
            }),
        );
    }

    // Exception handlers
    const exceptionHandlers: Transport[] = [];
    const rejectionHandlers: Transport[] = [];

    if (enableFileLogging || isProduction) {
        exceptionHandlers.push(
            new transports.File({
                filename: `${logDir}/exceptions.log`,
                format: productionFormat, // Add format
                maxFiles: 5,
                maxsize: 5242880,
            }),
        );

        rejectionHandlers.push(
            new transports.File({
                filename: `${logDir}/rejections.log`,
                format: productionFormat, // Add format
                maxFiles: 5,
                maxsize: 5242880,
            }),
        );

        // Also log to console in development for better visibility
        if (!isProduction) {
            exceptionHandlers.push(
                new transports.Console({
                    format: developmentFormat,
                }),
            );
            rejectionHandlers.push(
                new transports.Console({
                    format: developmentFormat,
                }),
            );
        }
    }

    return {
        exceptionHandlers:
            exceptionHandlers.length > 0 ? exceptionHandlers : undefined,
        exitOnError: false,
        format: format.combine(
            format.errors({ stack: true }),
            format.timestamp(),
        ),
        level: logLevel,
        levels: logLevels,
        rejectionHandlers:
            rejectionHandlers.length > 0 ? rejectionHandlers : undefined,
        transports: loggerTransports,
    };
}
