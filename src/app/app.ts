// src/app/app.ts
import compression from "compression";
import cors from "cors";
import express, { Express, Router } from "express";
import helmet from "helmet";
import { Server } from "http";
import passport from "passport";

import { iocContainer } from "@/app/ioc.container.js";
import { corsOptions } from "@/config/cors.js";
import {
    initializePostgreSQL,
    postgresDataSource,
} from "@/config/data.source.js";
import { helmetOptions } from "@/config/helmet.js";
import { getMorganConfig, setupRequestTracking } from "@/config/morgan.js";
import { PassportConfig } from "@/config/passport.config.js";
import { initializeRedis, redisClient } from "@/config/redis.js";
import swaggerDocs from "@/config/swagger.js";
import { OcrEventListenerService } from "@/event/orc.event.listener.service.js";
import { RegisterRoutes } from "@/generated/routes.js";
import { TokenCleanupJob } from "@/job/token.cleanup.job.js";
import ErrorMiddleware from "@/middleware/error.middleware.js";
import { PredictModelService } from "@/service/predic.model.service.js";
import { TYPES } from "@/type/container/types.js";
import { keyStore } from "@/util/key.js";
import logger from "@/util/logger.js";
import { config } from "@/util/validate.env.js";

class App {
    public basePath!: string;
    public express!: Express;
    public hostname!: string;
    public port!: number;
    private isShuttingDown = false;
    private server: null | Server = null;

    constructor() {
        this.express = express();
        this.port = config.SERVER_PORT;
        this.hostname = config.SERVER_HOSTNAME;
        this.basePath = config.SERVER_PATH;

        // Initialize synchronous components only
        this.initializeCors();
        this.initializeMiddleware();
        this.initializeRoutesAndDocs();
        this.initializeErrorHandling();
        this.initializeKeyStore();
        this.setupGracefulShutdown();
    }

    public getServerUrl(): string {
        return `http://${this.hostname}:${this.port.toString()}${this.basePath}`;
    }

    public async initialize(): Promise<void> {
        await this.initializeDatabaseConnections();
        this.initializePassportStrategies();
        this.initializeTokenCleanup();
        await this.initializeEventListeners();
        await this.initializePredictModelService();
    }

    public listen(): void {
        this.server = this.express.listen(this.port, this.hostname, () => {
            logger.info(
                `App listening on ${this.hostname}:${this.port.toString()}${this.basePath}`,
            );
        });
    }

    public async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            logger.warn(
                "Shutdown already in progress, ignoring duplicate signal",
            );
            return;
        }

        this.isShuttingDown = true;
        logger.info("🔄 Graceful shutdown initiated...");

        try {
            // Close HTTP server first
            if (this.server) {
                logger.info("📤 Closing HTTP server...");
                await new Promise<void>((resolve, reject) => {
                    this.server?.close((error?: Error) => {
                        if (error) {
                            logger.error(
                                "❌ Error closing HTTP server:",
                                error,
                            );
                            reject(error);
                        } else {
                            logger.info("✅ HTTP server closed successfully");
                            resolve();
                        }
                    });
                });
            }

            // Stop token cleanup job
            try {
                const tokenCleanupJob = iocContainer.get<TokenCleanupJob>(
                    TYPES.TokenCleanupJob,
                );
                tokenCleanupJob.stop();
                logger.info("✅ Token cleanup job stopped");
            } catch (error: unknown) {
                logger.warn("⚠️ Error stopping token cleanup job:", error);
            }

            // Stop event listeners
            try {
                const ocrEventListener =
                    iocContainer.get<OcrEventListenerService>(
                        TYPES.OcrEventListenerService,
                    );
                await ocrEventListener.cleanup();
                logger.info("✅ Event listeners cleaned up");
            } catch (error: unknown) {
                logger.warn("⚠️ Error cleaning up event listeners:", error);
            }

            // Close database connections
            await this.closeDatabaseConnections();

            logger.info("🎉 Graceful shutdown completed successfully");
        } catch (error: unknown) {
            logger.error("❌ Error during graceful shutdown:", error);
            throw error;
        }
    }

    private async closeDatabaseConnections(): Promise<void> {
        logger.info("🔌 Closing database connections...");

        const closePromises: Promise<void>[] = [];

        // Close PostgreSQL connection
        if (postgresDataSource.isInitialized) {
            closePromises.push(
                postgresDataSource
                    .destroy()
                    .then(() => {
                        logger.info(
                            "✅ PostgreSQL connection closed successfully",
                        );
                    })
                    .catch((error: unknown) => {
                        logger.error(
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
                        logger.info("✅ Redis connection closed successfully");
                    })
                    .catch((error: unknown) => {
                        logger.error(
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
            logger.info("✅ All database connections closed successfully");
        } else {
            logger.info("ℹ️ No active database connections to close");
        }
    }

    private initializeCors(): void {
        this.express.use(cors(corsOptions));
    }

    private async initializeDatabaseConnections(): Promise<void> {
        logger.info("Initializing database connections...");

        try {
            // Initialize both PostgreSQL and Redis concurrently
            const postgresPromise = initializePostgreSQL();
            const redisPromise = initializeRedis();

            // Wait for both connections to complete
            await Promise.all([postgresPromise, redisPromise]);

            logger.info("✅ All database connections established successfully");
        } catch (error) {
            logger.error(
                "❌ Failed to initialize database connections:",
                error,
            );
            throw error;
        }
    }

    private initializeErrorHandling(): void {
        this.express.use(ErrorMiddleware);
    }
    private async initializeEventListeners(): Promise<void> {
        try {
            logger.info("Initializing event listeners...");

            // Initialize OCR event listener with proper type assertion
            const ocrEventListener = iocContainer.get<OcrEventListenerService>(
                TYPES.OcrEventListenerService,
            );

            await ocrEventListener.initialize();

            logger.info("✅ Event listeners initialized successfully");
        } catch (error) {
            logger.error("❌ Failed to initialize event listeners:", error);
            throw error;
        }
    }

    private initializeKeyStore(): void {
        if (keyStore.privateKey && keyStore.publicKey) {
            logger.info("Initializing key pairs successfully");
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
            logger.info("Passport strategies initialized successfully");
        } catch (error) {
            logger.error("Error initializing Passport strategies:", error);
            throw error;
        }
    }

    private async initializePredictModelService(): Promise<void> {
        try {
            logger.info("🔗 Initializing Predict Model Service...");

            const predictModelService = iocContainer.get<PredictModelService>(
                TYPES.PredictModelService,
            );

            // Perform health check with retry logic
            const maxRetries = 3;
            const retryDelay = 2000; // 2 seconds
            let connected = false;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    logger.info(
                        `🏥 Health check attempt ${attempt.toString()}/${maxRetries.toString()}`,
                    );
                    connected = await predictModelService.healthCheck();

                    if (connected) {
                        logger.info(
                            "✅ Predict Model Service is healthy and ready",
                        );
                        break;
                    } else {
                        logger.warn(
                            `⚠️ Health check failed on attempt ${attempt.toString()}`,
                        );

                        if (attempt < maxRetries) {
                            logger.info(
                                `⏳ Retrying in ${retryDelay.toString()}ms...`,
                            );
                            await new Promise((resolve) =>
                                setTimeout(resolve, retryDelay),
                            );
                        }
                    }
                } catch (error) {
                    logger.error(
                        `❌ Health check error on attempt ${attempt.toString()}:`,
                        error,
                    );

                    if (attempt === maxRetries) {
                        throw error;
                    }

                    if (attempt < maxRetries) {
                        logger.info(
                            `⏳ Retrying in ${retryDelay.toString()}ms...`,
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, retryDelay),
                        );
                    }
                }
            }

            if (!connected) {
                const errorMessage =
                    "Failed to establish connection to Predict Model Service after all retry attempts";
                logger.error("❌ " + errorMessage);

                throw new Error(errorMessage);
            }
        } catch (error) {
            logger.error(
                "❌ Failed to initialize Predict Model Service:",
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
        if (config.NODE_ENV !== "production") {
            try {
                logger.info("Setting up Swagger documentation...");
                swaggerDocs(this.express, this.getServerUrl());
                logger.info("Swagger documentation setup completed");
            } catch (error) {
                logger.error("Error setting up Swagger documentation:", error);
            }
        }

        const apiRouter: Router = express.Router();

        apiRouter.use(helmet(helmetOptions));

        RegisterRoutes(apiRouter);

        this.express.use(this.basePath, apiRouter);

        this.express.get("/health", (req, res) => {
            res.json({
                status: "healthy",
                timestamp: new Date().toISOString(),
            });
        });
    }

    private initializeTokenCleanup(): void {
        try {
            const tokenCleanupJob = iocContainer.get<TokenCleanupJob>(
                TYPES.TokenCleanupJob,
            );
            tokenCleanupJob.startPeriodicCleanup(60); // Run every hour
            logger.info("Token cleanup job initialized");
        } catch (error) {
            logger.error("Failed to initialize token cleanup job:", error);
        }
    }

    private setupGracefulShutdown(): void {
        // Handle process termination signals
        const signals = ["SIGTERM", "SIGINT", "SIGUSR2"] as const;

        signals.forEach((signal) => {
            process.on(signal, () => {
                void (async () => {
                    logger.info(
                        `📡 Received ${signal}, initiating graceful shutdown...`,
                    );

                    try {
                        await this.shutdown();
                        process.exit(0);
                    } catch (error: unknown) {
                        logger.error("❌ Error during shutdown:", error);
                        process.exit(1);
                    }
                })();
            });
        });

        // Handle uncaught exceptions
        process.on("uncaughtException", (error: Error) => {
            void (async () => {
                logger.error("💥 Uncaught Exception:", error);

                try {
                    await this.shutdown();
                } catch (shutdownError: unknown) {
                    logger.error(
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
                    logger.error(
                        "🚫 Unhandled Rejection at:",
                        promise,
                        "reason:",
                        reason,
                    );

                    try {
                        await this.shutdown();
                    } catch (shutdownError: unknown) {
                        logger.error(
                            "❌ Error during emergency shutdown:",
                            shutdownError,
                        );
                    }

                    process.exit(1);
                })();
            },
        );
    }
}

export default App;
