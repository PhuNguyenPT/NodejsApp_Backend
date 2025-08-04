// src/app/app.ts
import compression from "compression";
import cors from "cors";
import express, { Express, Router } from "express";
import helmet from "helmet";
import passport from "passport";

import { iocContainer } from "@/app/ioc.container.js";
import { corsOptions } from "@/config/cors";
import { AppDataSource } from "@/config/data.source.js";
import { helmetOptions } from "@/config/helmet";
import { getMorganConfig, setupRequestTracking } from "@/config/morgan.js";
import { PassportConfig } from "@/config/passport.config.js";
import swaggerDocs from "@/config/swagger";
import { RegisterRoutes } from "@/generated/routes.js";
import ErrorMiddleware from "@/middleware/error.middleware.js";
import { TYPES } from "@/type/container/types.js";
import { keyStore } from "@/util/key";
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

        this.initializeDatabaseConnection();
        this.initializePassportStrategies();
        this.initializeCors();
        this.initializeMiddleware();
        this.initializeRoutesAndDocs();
        this.initializeErrorHandling();
        this.initializeKeyStore();
    }

    public getServerUrl(): string {
        return `http://${this.hostname}:${this.port.toString()}${this.basePath}`;
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

    private initializeDatabaseConnection(): void {
        AppDataSource.initialize()
            .then(() => {
                logger.info("Database connection established");
            })
            .catch((error: unknown) => {
                logger.error("Error during Data Source initialization:", error);
            });
    }

    private initializeErrorHandling(): void {
        this.express.use(ErrorMiddleware);
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
}

export default App;
