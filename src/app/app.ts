// src/app/app.ts
import compression from "compression";
import cors from "cors";
import express, { Express, Router } from "express";
import helmet from "helmet";

import { AppDataSource } from "@/config/data.source.js";
import { getMorganConfig, setupRequestTracking } from "@/config/morgan.js";
import { RegisterRoutes } from "@/generated/routes.js";
import ErrorMiddleware from "@/middleware/error.middleware.js";
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
        this.initializeCors();
        this.initializeMiddleware();
        this.initializeRoutes();
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

    private getCorsOptions() {
        const corsOptions = {
            allowedHeaders: [
                "Origin",
                "X-Requested-With",
                "Content-Type",
                "Accept",
                "Authorization",
                "Cache-Control",
                "Pragma",
            ],
            credentials: config.CORS_CREDENTIALS,
            exposedHeaders: ["Authorization", "X-Total-Count", "X-Request-ID"],
            maxAge: 86400,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            origin: config.CORS_ORIGIN,
        };

        logger.info("CORS Configuration:", corsOptions);
        return corsOptions;
    }
    private initializeCors(): void {
        this.express.use(cors(this.getCorsOptions()));
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
        this.express.use(helmet());
        // Request tracking (must come before Morgan)
        this.initializeRequestTracking();
        this.initializeMorganLogging();
        this.express.use(express.json({ limit: "10mb" })); // Added size limit
        this.express.use(
            express.urlencoded({ extended: false, limit: "10mb" }),
        );
        this.express.use(compression());
    }

    private initializeMorganLogging(): void {
        // Morgan logging based on environment
        const morganMiddlewares = getMorganConfig();
        morganMiddlewares.forEach((middleware) => {
            this.express.use(middleware);
        });
    }

    private initializeRequestTracking(): void {
        // Request tracking (must come before Morgan)
        this.express.use(setupRequestTracking());
    }

    private initializeRoutes(): void {
        // Create a router for the API base path
        const apiRouter: Router = express.Router();

        // Register TSOA routes to the API router
        RegisterRoutes(apiRouter);

        // Mount the API router at the base path
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
