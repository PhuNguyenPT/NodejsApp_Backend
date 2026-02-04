import type { Request, RequestHandler, Response } from "express";

import morgan, { token } from "morgan";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { createStream } from "rotating-file-stream";
import { v7 } from "uuid";

import { logger } from "@/config/logger.config.js";
import { type UUID, UUIDSchema } from "@/type/common/uuid.type.js";
import { config } from "@/util/validate-env.js";

interface ExtendedRequest extends Request {
    requestId?: UUID;
}

// Custom token to get real client IP from Cloudflare headers
token("real-ip", (req: Request) => {
    // Priority order for getting real client IP
    // 1. CF-Connecting-IP (set by Cloudflare, most reliable)
    // 2. True-Client-IP (Cloudflare Enterprise)
    // 3. X-Real-IP (set by nginx from CF-Connecting-IP)
    // 4. First IP in X-Forwarded-For
    // 5. Fallback to socket address

    const cfConnectingIp = req.headers["cf-connecting-ip"];
    const trueClientIp = req.headers["true-client-ip"];
    const realIp = req.headers["x-real-ip"];
    const forwardedFor = req.headers["x-forwarded-for"];

    // Return first valid IP found
    if (typeof cfConnectingIp === "string" && cfConnectingIp) {
        return cfConnectingIp;
    }

    if (typeof trueClientIp === "string" && trueClientIp) {
        return trueClientIp;
    }

    if (typeof realIp === "string" && realIp) {
        return realIp;
    }

    if (forwardedFor) {
        const firstIp = Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : forwardedFor.split(",")[0];
        if (firstIp) return firstIp.trim();
    }

    return req.socket.remoteAddress ?? req.ip ?? "unknown";
});

token("request-id", (req: ExtendedRequest) => req.requestId ?? "unknown");

// Custom token for status code with color coding
token("status-colored", (_req: Request, res: Response) => {
    const status = res.statusCode;
    const statusStr = status.toString();

    if (status >= 500) return `\x1b[31m${statusStr}\x1b[0m`; // Red for 5xx
    if (status >= 400) return `\x1b[33m${statusStr}\x1b[0m`; // Yellow for 4xx
    if (status >= 300) return `\x1b[36m${statusStr}\x1b[0m`; // Cyan for 3xx
    return `\x1b[32m${statusStr}\x1b[0m`; // Green for 2xx
});

// Custom token for content length with fallback
token("content-length-safe", (_req: Request, res: Response) => {
    return res.getHeader("content-length")?.toString() ?? "0";
});

// Add Cloudflare metadata tokens
token("cf-ray", (req: Request) => {
    return req.headers["cf-ray"]?.toString() ?? "-";
});

token("cf-country", (req: Request) => {
    return req.headers["cf-ipcountry"]?.toString() ?? "-";
});

// Custom format for production (structured) with Cloudflare data
const productionFormat =
    '{"timestamp":":date[iso]","id":":request-id","ip":":real-ip","cfRay":":cf-ray","country":":cf-country","method":":method","url":":url","status":":status","responseTime":":response-time","contentLength":":content-length-safe","userAgent":":user-agent"}';

// Detailed format with real client IP
const detailedFormat =
    ':request-id :real-ip - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :content-length-safe ":referrer" ":user-agent" - :response-time ms';

const devFormat =
    "\x1b[35m:request-id\x1b[0m \x1b[36m:method\x1b[0m \x1b[37m:url\x1b[0m :status-colored :response-time ms - :content-length-safe bytes";

// Stream configuration for file logging with rotation
const getLogStream = () => {
    if (!config.ENABLE_FILE_LOGGING) return undefined;

    const logDir = resolve(config.LOG_DIR);

    // Ensure log directory exists
    if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
    }

    // Create rotating stream
    return createStream("access.log", {
        // Compression & permissions
        compress: "gzip", // Compress old logs
        encoding: "utf8",
        // Optional: tracking
        history: join(logDir, ".rotation-history"),

        immutable: true, // Don't modify rotated files
        // Rotation timing
        interval: "1d", // Rotate daily
        intervalBoundary: true, // At midnight UTC

        intervalUTC: true, // Use UTC time
        // File management
        maxFiles: 14, // Keep 14 days
        maxSize: "200M", // Max 200MB total disk usage

        mode: 0o640, // rw-r----- permissions
        // Path & encoding
        path: logDir,

        size: "10M", // Also rotate if reaches 10MB
    });
};

// Skip function for health checks and static assets
const skipHealthChecks = (req: Request): boolean => {
    return (
        req.url === "/health" ||
        req.url.startsWith("/static") ||
        req.url.startsWith("/favicon")
    );
};

/**
 * Get Morgan middleware configuration based on NODE_ENV
 * - development/test: Colored console output + optional file logging
 * - production/staging: JSON file logging + error-only console output
 */
export const getMorganConfig = (): RequestHandler[] => {
    const middlewares: RequestHandler[] = [];
    const logStream = getLogStream();

    switch (config.NODE_ENV) {
        case "development":
        case "test":
            // Console logging with colors for development/test
            middlewares.push(
                morgan(devFormat, {
                    skip: skipHealthChecks,
                    stream: {
                        write: (message: string) => {
                            logger.http(message.trim());
                        },
                    },
                }),
            );

            // File logging if enabled
            if (logStream) {
                middlewares.push(
                    morgan(detailedFormat, {
                        skip: skipHealthChecks,
                        stream: logStream,
                    }),
                );
            }
            break;

        case "production":
        case "staging":
            // Console: errors only
            middlewares.push(
                morgan(detailedFormat, {
                    skip: (req: Request, res: Response) => {
                        return res.statusCode < 400 || skipHealthChecks(req);
                    },
                    stream: {
                        write: (message: string) => {
                            logger.error(`HTTP Error: ${message.trim()}`);
                        },
                    },
                }),
            );

            // File: all requests in structured JSON format
            if (logStream) {
                middlewares.push(
                    morgan(productionFormat, {
                        skip: skipHealthChecks,
                        stream: logStream,
                    }),
                );
            }
            break;

        default:
            // Fallback: use same behavior as development/test
            middlewares.push(
                morgan(devFormat, {
                    skip: skipHealthChecks,
                    stream: {
                        write: (message: string) => {
                            logger.http(message.trim());
                        },
                    },
                }),
            );

            if (logStream) {
                middlewares.push(
                    morgan(detailedFormat, {
                        skip: skipHealthChecks,
                        stream: logStream,
                    }),
                );
            }
    }

    return middlewares;
};

/**
 * Middleware to track requests with unique UUIDs
 * Adds req.requestId and X-Request-ID response header
 */
export const requestTrackingMiddleware: RequestHandler = (
    req: ExtendedRequest,
    res: Response,
    next,
) => {
    req.requestId = UUIDSchema.parse(v7());
    res.setHeader("X-Request-ID", req.requestId);
    next();
};

export default getMorganConfig;
