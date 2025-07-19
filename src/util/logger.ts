import winston, { format, transports } from "winston";

import { config } from "@/util/validate.env.js";

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

// Custom format for development with metadata support
const developmentFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  format.colorize({ all: true }),
  format.printf((info) => {
    const { level, message, timestamp, ...meta } = info;

    // Base log message
    let logMessage = `${String(timestamp)} ${level}: ${String(message)}`;

    // Add metadata if it exists
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }

    return logMessage;
  }),
);

// Custom format for production
const productionFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
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

// Create logger instance
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

export default logger;
