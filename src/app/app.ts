// src/app/app.ts
import compression from "compression";
import cors from "cors";
import express, { Express, Router } from "express";
import fs from "fs";
import helmet from "helmet";
import { Server } from "http";
import https from "https";
import multer from "multer";
import passport from "passport";
import { Logger } from "winston";

import { iocContainer } from "@/app/ioc-container.js";
import { Config } from "@/config/app.config.js";
import { corsOptions } from "@/config/cors.config.js";
import {
    initializePostgreSQL,
    postgresDataSource,
} from "@/config/data-source.config.js";
import { helmetOptions } from "@/config/helmet.config.js";
import { keyStore } from "@/config/key.config.js";
import { logger } from "@/config/logger.config.js";
import {
    getMorganConfig,
    setupRequestTracking,
} from "@/config/morgan.config.js";
import { PassportConfig } from "@/config/passport.config.js";
import { initializeRedis, redisClient } from "@/config/redis.config.js";
import swaggerDocs from "@/config/swagger.config.js";
import { RegisterRoutes } from "@/generated/routes.js";
import ErrorMiddleware from "@/middleware/error-middleware.js";
import { PredictionServiceClient } from "@/type/class/prediction-service.client.js";
import { TYPES } from "@/type/container/types.js";

class App {
    public readonly basePath: string;
    public readonly express: Express;
    public readonly hostname: string;
    public readonly port: number;
    public readonly tlsPort: number;
    private isShuttingDown = false;
    private readonly logger: Logger;
    private server: null | Server = null;
    private tlsServer: https.Server | null = null;

    constructor(readonly config: Config) {
        this.express = express();
        this.express.set("trust proxy", 1);

        this.port = config.SERVER_PORT;
        this.tlsPort = config.SERVER_TLS_PORT;
        this.hostname = config.SERVER_HOSTNAME;
        this.basePath = config.SERVER_PATH;
        this.logger = logger;

        // Initialize synchronous components only
        this.initializeCors();
        this.initializeMiddleware();
        this.initializeRoutesAndDocs();
        this.initializeErrorHandling();
        this.initializeKeyStore();
        this.setupGracefulShutdown();
    }

    public getServerUrl(): string {
        // Use relative path for Swagger when hostname is 0.0.0.0 or localhost
        if (this.hostname === "0.0.0.0" || this.hostname === "localhost") {
            return `http://localhost:${this.port.toString()}${this.basePath}`;
        }
        return `http://${this.hostname}:${this.port.toString()}${this.basePath}`;
    }

    public async initialize(): Promise<void> {
        await this.initializeDatabaseConnections();
        this.initializePassportStrategies();
        await this.initializePredictModelServer();
    }

    public listen(): void {
        // Start HTTP server (for health checks and internal communication)
        this.server = this.express.listen(this.port, this.hostname, () => {
            this.logger.info(
                `🔓 HTTP Server listening on ${this.hostname}:${this.port.toString()}${this.basePath}`,
            );
        });

        // Start HTTPS server (for secure external communication)
        this.startTLSServer();
    }

    public async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            this.logger.warn(
                "Shutdown already in progress, ignoring duplicate signal",
            );
            return;
        }

        this.isShuttingDown = true;
        this.logger.info("🔄 Graceful shutdown initiated...");

        try {
            // Close HTTP server first
            if (this.server) {
                this.logger.info("📤 Closing HTTP server...");
                await new Promise<void>((resolve, reject) => {
                    this.server?.close((error?: Error) => {
                        if (error) {
                            this.logger.error(
                                "❌ Error closing HTTP server:",
                                error,
                            );
                            reject(error);
                        } else {
                            this.logger.info(
                                "✅ HTTP server closed successfully",
                            );
                            resolve();
                        }
                    });
                });
            }

            // Close database connections
            await this.closeDatabaseConnections();

            this.logger.info("🎉 Graceful shutdown completed successfully");
        } catch (error: unknown) {
            this.logger.error("❌ Error during graceful shutdown:", error);
            throw error;
        }
    }

    private async closeDatabaseConnections(): Promise<void> {
        this.logger.info("🔌 Closing database connections...");

        const closePromises: Promise<void>[] = [];

        // Close PostgreSQL connection
        if (postgresDataSource.isInitialized) {
            closePromises.push(
                postgresDataSource
                    .destroy()
                    .then(() => {
                        this.logger.info(
                            "✅ PostgreSQL connection closed successfully",
                        );
                    })
                    .catch((error: unknown) => {
                        this.logger.error(
                            "❌ Error closing PostgreSQL connection:",
                            error,
                        );
                        throw error;
                    }),
            );
        }

        // Close Redis connection
        if (redisClient.isOpen) {
            closePromises.push(
                redisClient
                    .quit()
                    .then(() => {
                        this.logger.info(
                            "✅ Redis connection closed successfully",
                        );
                    })
                    .catch((error: unknown) => {
                        this.logger.error(
                            "❌ Error closing Redis connection:",
                            error,
                        );
                        throw error;
                    }),
            );
        }

        // Wait for all database connections to close
        if (closePromises.length > 0) {
            await Promise.all(closePromises);
            this.logger.info("✅ All database connections closed successfully");
        } else {
            this.logger.info("ℹ️ No active database connections to close");
        }
    }

    private initializeCors(): void {
        this.express.use(cors(corsOptions));
    }

    private async initializeDatabaseConnections(): Promise<void> {
        this.logger.info("Initializing database connections...");

        try {
            // Initialize both PostgreSQL and Redis concurrently
            const postgresPromise = initializePostgreSQL();
            const redisPromise = initializeRedis();

            // Wait for both connections to complete
            await Promise.all([postgresPromise, redisPromise]);

            this.logger.info(
                "✅ All database connections established successfully",
            );
        } catch (error) {
            this.logger.error(
                "❌ Failed to initialize database connections:",
                error,
            );
            throw error;
        }
    }

    private initializeErrorHandling(): void {
        this.express.use(ErrorMiddleware);
    }

    private initializeKeyStore(): void {
        if (keyStore.privateKey && keyStore.publicKey) {
            this.logger.info("Initializing key pairs successfully");
        }
    }

    private initializeMiddleware(): void {
        this.initializeRequestTracking();
        this.initializeMorganLogging();
        this.express.use(express.json({ limit: "10mb" }));
        this.express.use(
            express.urlencoded({ extended: false, limit: "10mb" }),
        );
        this.express.use(compression());
        this.express.use(passport.initialize());
    }

    private initializeMorganLogging(): void {
        // Morgan logging based on environment
        const morganMiddlewares = getMorganConfig();
        morganMiddlewares.forEach((middleware) => {
            this.express.use(middleware);
        });
    }

    private initializePassportStrategies(): void {
        try {
            const passportConfig = iocContainer.get<PassportConfig>(
                TYPES.PassportConfig,
            );
            passportConfig.initializeStrategies();
            this.logger.info("Passport strategies initialized successfully");
        } catch (error) {
            this.logger.error("Error initializing Passport strategies:", error);
            throw error;
        }
    }

    private async initializePredictModelServer(): Promise<void> {
        try {
            this.logger.info("🔗 Predict Model Server: Initializing...");

            const predictModelServer: PredictionServiceClient =
                iocContainer.get<PredictionServiceClient>(
                    TYPES.PredictionServiceClient,
                );

            // Perform health check with retry logic
            const maxRetries = 3;
            const retryDelay = 2000; // 2 seconds
            let connected = false;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    this.logger.info(
                        `🏥 Predict Model Server: Health check attempt ${attempt.toString()}/${maxRetries.toString()}`,
                    );
                    connected = await predictModelServer.healthCheck();

                    if (connected) {
                        this.logger.info(
                            "✅ Predict Model Server: Is Healthy and Ready",
                        );
                        break;
                    } else {
                        this.logger.warn(
                            `⚠️ Predict Model Server: Health check failed on attempt ${attempt.toString()}`,
                        );

                        if (attempt < maxRetries) {
                            this.logger.info(
                                `⏳ Predict Model Server: Retrying in ${retryDelay.toString()}ms...`,
                            );
                            await new Promise((resolve) =>
                                setTimeout(resolve, retryDelay),
                            );
                        }
                    }
                } catch (error) {
                    this.logger.error(
                        `❌ Predict Model Server: Health check error on attempt ${attempt.toString()}:`,
                        error,
                    );

                    if (attempt === maxRetries) {
                        throw error;
                    }

                    if (attempt < maxRetries) {
                        this.logger.info(
                            `⏳ Predict Model Server: Retrying in ${retryDelay.toString()}ms...`,
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, retryDelay),
                        );
                    }
                }
            }

            if (!connected) {
                const errorMessage =
                    "Predict Model Server: Failed to establish connection after all retry attempts";
                this.logger.error("❌ " + errorMessage);

                throw new Error(errorMessage);
            }
        } catch (error) {
            this.logger.error(
                "❌ Predict Model Server: Failed to initialize Predict Model Server:",
                error,
            );
            throw error;
        }
    }

    private initializeRequestTracking(): void {
        // Request tracking (must come before Morgan)
        this.express.use(setupRequestTracking());
    }

    private initializeRoutesAndDocs(): void {
        if (this.config.NODE_ENV !== "production") {
            try {
                this.logger.info("Setting up Swagger documentation...");
                swaggerDocs(this.express, this.getServerUrl());
                this.logger.info("Swagger documentation setup completed");
            } catch (error) {
                this.logger.error(
                    "Error setting up Swagger documentation:",
                    error,
                );
            }
        }

        const apiRouter: Router = express.Router();

        apiRouter.use(helmet(helmetOptions));

        const multerOptions = iocContainer.get<multer.Options>(
            TYPES.MulterOptions,
        );
        RegisterRoutes(apiRouter, { multer: multer(multerOptions) });

        this.express.use(this.basePath, apiRouter);

        this.express.get("/health", (req, res) => {
            res.json({
                status: "healthy",
                timestamp: new Date().toISOString(),
            });
        });
    }

    private setupGracefulShutdown(): void {
        // Handle process termination signals
        const signals = ["SIGTERM", "SIGINT", "SIGUSR2"] as const;

        signals.forEach((signal) => {
            process.on(signal, () => {
                void (async () => {
                    this.logger.info(
                        `📡 Received ${signal}, initiating graceful shutdown...`,
                    );

                    try {
                        await this.shutdown();
                        process.exit(0);
                    } catch (error: unknown) {
                        this.logger.error("❌ Error during shutdown:", error);
                        process.exit(1);
                    }
                })();
            });
        });

        // Handle uncaught exceptions
        process.on("uncaughtException", (error: Error) => {
            void (async () => {
                this.logger.error("💥 Uncaught Exception:", error);

                try {
                    await this.shutdown();
                } catch (shutdownError: unknown) {
                    this.logger.error(
                        "❌ Error during emergency shutdown:",
                        shutdownError,
                    );
                }

                process.exit(1);
            })();
        });

        // Handle unhandled promise rejections
        process.on(
            "unhandledRejection",
            (reason: unknown, promise: Promise<unknown>) => {
                void (async () => {
                    this.logger.error(
                        "🚫 Unhandled Rejection at:",
                        promise,
                        "reason:",
                        reason,
                    );

                    try {
                        await this.shutdown();
                    } catch (shutdownError: unknown) {
                        this.logger.error(
                            "❌ Error during emergency shutdown:",
                            shutdownError,
                        );
                    }

                    process.exit(1);
                })();
            },
        );
    }

    private startTLSServer(): void {
        try {
            // Check if TLS certificates exist
            if (!fs.existsSync(this.config.TLS_KEY_PATH)) {
                this.logger.warn(
                    `⚠️ TLS key not found at ${this.config.TLS_KEY_PATH}. Skipping HTTPS server...`,
                );
                return;
            }

            if (!fs.existsSync(this.config.TLS_CERT_PATH)) {
                this.logger.warn(
                    `⚠️ TLS certificate not found at ${this.config.TLS_CERT_PATH}. Skipping HTTPS server...`,
                );
                return;
            }

            this.logger.info("🔐 Initializing HTTPS server with TLS...");

            // Read TLS certificates
            const tlsOptions: https.ServerOptions = {
                ca: fs.readFileSync(this.config.TLS_CA_PATH),
                cert: fs.readFileSync(this.config.TLS_CERT_PATH),

                ciphers: [
                    "ECDHE-ECDSA-AES128-GCM-SHA256",
                    "ECDHE-RSA-AES128-GCM-SHA256",
                    "ECDHE-ECDSA-AES256-GCM-SHA384",
                    "ECDHE-RSA-AES256-GCM-SHA384",
                    "ECDHE-ECDSA-CHACHA20-POLY1305",
                    "ECDHE-RSA-CHACHA20-POLY1305",
                ].join(":"),
                honorCipherOrder: true,
                key: fs.readFileSync(this.config.TLS_KEY_PATH),

                maxVersion: "TLSv1.3" as const,
                // TLS settings
                minVersion: "TLSv1.2" as const,
                rejectUnauthorized: false, // Set to true in production for strict mTLS
                requestCert: true,
            };

            this.tlsServer = https.createServer(tlsOptions, this.express);

            this.tlsServer.listen(this.tlsPort, this.hostname, () => {
                this.logger.info(
                    `🔒 HTTPS Server listening on ${this.hostname}:${this.tlsPort.toString()}${this.basePath}`,
                );
            });

            this.tlsServer.on("error", (error) => {
                this.logger.error("❌ HTTPS Server error:", error);
            });

            // Optional: Log TLS connections for debugging
            if (this.config.NODE_ENV === "development") {
                this.tlsServer.on("secureConnection", (tlsSocket) => {
                    this.logger.debug("🔐 TLS Connection established:", {
                        authorized: tlsSocket.authorized,
                        cipher: tlsSocket.getCipher().name,
                        protocol: tlsSocket.getProtocol(),
                    });
                });
            }
        } catch (error) {
            this.logger.error("❌ Failed to start TLS server:", error);
            this.logger.info("ℹ️ Continuing with HTTP only...");
        }
    }
}

export default App;
