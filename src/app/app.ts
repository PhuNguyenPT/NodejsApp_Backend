// src/app/app.ts
import compression from "compression";
import cors from "cors";
import express, { Express, Router } from "express";
import helmet from "helmet";
import passport from "passport";

import { iocContainer } from "@/app/ioc.container.js";
import { corsOptions } from "@/config/cors.js";
import { initializePostgreSQL } from "@/config/data.source.js";
import { helmetOptions } from "@/config/helmet.js";
import { getMorganConfig, setupRequestTracking } from "@/config/morgan.js";
import { PassportConfig } from "@/config/passport.config.js";
import { initializeRedis } from "@/config/redis.js";
import swaggerDocs from "@/config/swagger.js";
import { OcrEventListenerService } from "@/event/orc.event.listener.service";
import { RegisterRoutes } from "@/generated/routes.js";
import { TokenCleanupJob } from "@/job/token.cleanup.job";
import ErrorMiddleware from "@/middleware/error.middleware.js";
import { TYPES } from "@/type/container/types.js";
import { keyStore } from "@/util/key.js";
import logger from "@/util/logger.js";
import { config } from "@/util/validate.env.js";

class App {
    public basePath!: string;
    public express!: Express;
    public hostname!: string;
    public port!: number;

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
    }

    public getServerUrl(): string {
        return `http://${this.hostname}:${this.port.toString()}${this.basePath}`;
    }

    // Separate async initialization method with concurrent database connections
    public async initialize(): Promise<void> {
        await this.initializeDatabaseConnections();
        this.initializePassportStrategies();
        this.initializeTokenCleanup();
        await this.initializeEventListeners();
    }

    public listen(): void {
        this.express.listen(this.port, this.hostname, () => {
            logger.info(
                `App listening on ${this.hostname}:${this.port.toString()}${this.basePath}`,
            );
        });
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
}

export default App;
