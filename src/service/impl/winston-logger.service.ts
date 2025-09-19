// src/util/winston-logger.service.ts
import { inject, injectable } from "inversify";
import { Logger } from "winston";

import { TYPES } from "@/type/container/types.js";
import { ILogger } from "@/type/interface/logger.interface.js";
import {
    createWinstonLogger,
    LoggerConfig,
    processLogMeta,
    truncateArray,
} from "@/util/logger.js";

@injectable()
export class WinstonLoggerService implements ILogger {
    private readonly logger: Logger;

    constructor(
        @inject(TYPES.LoggerConfig) private readonly loggerConfig: LoggerConfig,
    ) {
        this.logger = createWinstonLogger(this.loggerConfig);
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
