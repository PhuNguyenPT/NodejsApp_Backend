import type { Request, RequestHandler, Response } from "express";

// src/config/morgan.config.ts
import fs from "fs";
import morgan from "morgan";
import path from "path";

import { logger } from "@/config/logger.config.js";
import { config } from "@/util/validate-env.js";

// Extended request interface for custom properties
interface ExtendedRequest extends Request {
    requestId?: string;
}
// Custom token to get real IP address
morgan.token("real-ip", (req: Request) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    const realIp = req.headers["x-real-ip"];

    return (
        (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ??
        (typeof realIp === "string" ? realIp : undefined) ??
        req.socket.remoteAddress ??
        req.ip ??
        "unknown"
    );
});

morgan.token(
    "request-id",
    (req: ExtendedRequest) => req.requestId ?? "unknown",
);

// Custom token for response time with color coding
morgan.token("response-time-colored", (req: Request, res: Response) => {
    const responseTimeToken = (
        morgan as unknown as {
            "response-time": (
                req: Request,
                res: Response,
            ) => string | undefined;
        }
    )["response-time"];
    const responseTimeStr = responseTimeToken(req, res) ?? "0";
    const responseTime = parseFloat(responseTimeStr);

    if (responseTime > 1000)
        return `\x1b[31m${responseTime.toString()}ms\x1b[0m`; // Red for > 1s
    if (responseTime > 500)
        return `\x1b[33m${responseTime.toString()}ms\x1b[0m`; // Yellow for > 500ms
    return `\x1b[32m${responseTime.toString()}ms\x1b[0m`; // Green for < 500ms
});

// Custom token for status code with color coding
morgan.token("status-colored", (_req: Request, res: Response) => {
    const status = res.statusCode;
    const statusStr = status.toString();

    if (status >= 500) return `\x1b[31m${statusStr}\x1b[0m`; // Red for 5xx
    if (status >= 400) return `\x1b[33m${statusStr}\x1b[0m`; // Yellow for 4xx
    if (status >= 300) return `\x1b[36m${statusStr}\x1b[0m`; // Cyan for 3xx
    return `\x1b[32m${statusStr}\x1b[0m`; // Green for 2xx
});

// Custom token for content length with fallback
morgan.token("content-length-safe", (_req: Request, res: Response) => {
    return res.getHeader("content-length")?.toString() ?? "0";
});

// Custom format for production (structured) - FIXED
const productionFormat =
    '{"timestamp":":date[iso]","id":":request-id","ip":":real-ip","method":":method","url":":url","status":":status","responseTime":":response-time","contentLength":":content-length-safe","userAgent":":user-agent"}';

// Update your other formats to use the safe token as well:
const detailedFormat =
    ':request-id :real-ip - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :content-length-safe ":referrer" ":user-agent" - :response-time ms';

const devFormat =
    "\x1b[35m:request-id\x1b[0m \x1b[36m:method\x1b[0m \x1b[37m:url\x1b[0m :status-colored :response-time-colored - :content-length-safe bytes";

// Stream configuration for file logging
const getLogStream = () => {
    if (!config.ENABLE_FILE_LOGGING) return undefined;

    const logDir = path.resolve(config.LOG_DIR);

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, "access.log");

    return fs.createWriteStream(logFile, { flags: "a" });
};

// Skip function for health checks and static assets
const skipHealthChecks = (req: Request): boolean => {
    return (
        req.url === "/health" ||
        req.url.startsWith("/static") ||
        req.url.startsWith("/favicon")
    );
};

// Configuration factory
export const getMorganConfig = (): RequestHandler[] => {
    const middlewares: RequestHandler[] = [];
    const logStream = getLogStream();

    switch (config.NODE_ENV) {
        case "development":
            // Console logging with colors for development
            middlewares.push(
                morgan(devFormat, {
                    skip: skipHealthChecks,
                    stream: {
                        write: (message: string) => {
                            // Remove trailing newline and log through our logger
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
            // Only log errors and warnings in production console
            middlewares.push(
                morgan(detailedFormat, {
                    skip: (req: Request, res: Response) => {
                        return res.statusCode < 400 || skipHealthChecks(req);
                    },
                    stream: {
                        write: (message: string) => {
                            logger.warn(`HTTP Error: ${message.trim()}`);
                        },
                    },
                }),
            );

            // All requests to file in structured format - FIXED: Remove .replace()
            if (logStream) {
                middlewares.push(
                    morgan(productionFormat, {
                        // <-- Remove the .replace(/"/g, "") here
                        stream: logStream,
                    }),
                );
            }

            // Separate error logging
            middlewares.push(
                morgan(detailedFormat, {
                    skip: (_req: Request, res: Response) =>
                        res.statusCode < 400,
                    stream: {
                        write: (message: string) => {
                            logger.error(`HTTP Error: ${message.trim()}`);
                        },
                    },
                }),
            );
            break;

        case "staging":
            // Combined format for staging
            middlewares.push(
                morgan(detailedFormat, {
                    skip: skipHealthChecks,
                    stream: {
                        write: (message: string) => {
                            logger.http(message.trim());
                        },
                    },
                }),
            );

            // File logging
            if (logStream) {
                middlewares.push(
                    morgan(detailedFormat, {
                        stream: logStream,
                    }),
                );
            }
            break;

        default:
            // Fallback to simple format
            middlewares.push(morgan("common"));
    }

    return middlewares;
};

// Helper function to setup request ID tracking
export const setupRequestTracking = (): RequestHandler => {
    return (req: ExtendedRequest, res: Response, next) => {
        // Generate unique request ID
        const timestamp = Date.now().toString();
        const randomString = Math.random().toString(36).substring(2, 9);
        req.requestId = `${timestamp}-${randomString}`;

        // Add request ID to response headers
        res.setHeader("X-Request-ID", req.requestId);

        next();
    };
};

// Enhanced format with request ID
const requestIdFormat =
    ":request-id :real-ip :method :url :status :response-time ms";

export const getMorganWithRequestId = (): RequestHandler => {
    return morgan(requestIdFormat, {
        stream: {
            write: (message: string) => {
                logger.http(message.trim());
            },
        },
    });
};

export default getMorganConfig;
