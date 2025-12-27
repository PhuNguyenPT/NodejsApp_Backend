// src/manager/lifecycle.manager.ts
import { inject, injectable } from "inversify";
import { Logger } from "winston";

import type { Config } from "@/config/app.config.js";

import { keyStore } from "@/config/key.config.js";
import { PassportConfig } from "@/config/passport.config.js";
import { DatabaseManager } from "@/manager/database.manager.js";
import { ServerManager } from "@/manager/server.manager.js";
import { PredictionServiceClient } from "@/type/class/prediction-service.client.js";
import { TYPES } from "@/type/container/types.js";

@injectable()
export class LifecycleManager {
    private isShuttingDown = false;

    constructor(
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.Config) private readonly config: Config,
        @inject(TYPES.PassportConfig)
        private readonly passportConfig: PassportConfig,
        @inject(TYPES.PredictionServiceClient)
        private readonly predictionServiceClient: PredictionServiceClient,
        @inject(TYPES.DatabaseManager)
        private readonly databaseManager: DatabaseManager,
        @inject(TYPES.ServerManager)
        private readonly serverManager: ServerManager,
    ) {}

    /**
     * Initialize all application components
     */
    public async initialize(): Promise<void> {
        this.logger.info("🚀 Initializing application components...");

        try {
            // Initialize key store
            this.initializeKeyStore();

            // Initialize database connections
            await this.databaseManager.initializeAll();

            // Initialize Passport strategies
            this.initializePassportStrategies();

            // Initialize prediction model server
            await this.initializePredictModelServer();

            this.logger.info(
                "✅ All application components initialized successfully",
            );
        } catch (error) {
            this.logger.error("❌ Failed to initialize application:", error);
            throw error;
        }
    }

    /**
     * Setup graceful shutdown handlers
     */
    public setupGracefulShutdown(): void {
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

        this.logger.info("✅ Graceful shutdown handlers registered");
    }

    /**
     * Graceful shutdown of all components
     */
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
            // Close servers
            await this.serverManager.shutdown();

            // Close database connections
            await this.databaseManager.closeAll();

            this.logger.info("🎉 Graceful shutdown completed successfully");
        } catch (error: unknown) {
            this.logger.error("❌ Error during graceful shutdown:", error);
            throw error;
        }
    }

    /**
     * Initialize key store
     */
    private initializeKeyStore(): void {
        if (keyStore.privateKey && keyStore.publicKey) {
            this.logger.info("✅ Key pairs initialized successfully");
        } else {
            this.logger.warn("⚠️ Key pairs not found");
        }
    }

    /**
     * Initialize Passport strategies
     */
    private initializePassportStrategies(): void {
        try {
            this.passportConfig.initializeStrategies();
            this.logger.info("✅ Passport strategies initialized successfully");
        } catch (error) {
            this.logger.error(
                "❌ Error initializing Passport strategies:",
                error,
            );
            throw error;
        }
    }

    /**
     * Initialize prediction model server with retry logic
     */
    private async initializePredictModelServer(): Promise<void> {
        if (this.config.CI) {
            this.logger.warn("⚠️ Predict Model Server: Skipped (CI/Test mode)");
            return;
        }

        try {
            this.logger.info("🔗 Predict Model Server: Initializing...");

            const maxRetries = 3;
            const retryDelay = 2000;
            let connected = false;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    this.logger.info(
                        `🏥 Predict Model Server: Health check attempt ${attempt.toString()}/${maxRetries.toString()}`,
                    );

                    connected =
                        await this.predictionServiceClient.healthCheck();

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
                "❌ Predict Model Server: Failed to initialize:",
                error,
            );
            throw error;
        }
    }
}
