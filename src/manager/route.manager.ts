// src/manager/route.manager.ts
import express, { type Express, Router } from "express";
import helmet from "helmet";
import { inject, injectable } from "inversify";
import multer, { type Options } from "multer";
import { Logger } from "winston";

import { type Config } from "@/config/app.config.js";
import { helmetOptions } from "@/config/helmet.config.js";
import swaggerDocs from "@/config/swagger.config.js";
import { RegisterRoutes } from "@/generated/routes.js";
import { DatabaseManager } from "@/manager/database.manager.js";
import { TYPES } from "@/type/container/types.js";

@injectable()
export class RouteManager {
    constructor(
        @inject(TYPES.Config) private readonly config: Config,
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.MulterOptions) private readonly multerOptions: Options,
        @inject(TYPES.DatabaseManager)
        private readonly databaseManager: DatabaseManager,
    ) {}

    /**
     * Initialize health check route
     */
    public initializeHealthRoute(app: Express): void {
        this.logger.info("Initializing health check route...");

        app.get("/health", (req, res) => {
            const dbStatus = this.databaseManager.getConnectionStatus();
            const isHealthy = this.databaseManager.isHealthy();

            res.status(isHealthy ? 200 : 503).json({
                databases: dbStatus,
                status: isHealthy ? "healthy" : "degraded",
                timestamp: new Date().toISOString(),
            });
        });

        this.logger.info("✅ Health check route initialized successfully");
    }

    /**
     * Initialize all routes (API routes with security middleware)
     */
    public initializeRoutes(app: Express, basePath: string): void {
        this.logger.info("Initializing routes...");

        // Create API router
        const apiRouter: Router = express.Router();

        // Apply security middleware to API routes
        apiRouter.use(helmet(helmetOptions));

        // Register TSOA generated routes with multer
        RegisterRoutes(apiRouter, { multer: multer(this.multerOptions) });

        // Mount API routes at base path
        app.use(basePath, apiRouter);

        this.logger.info("✅ API routes initialized successfully");
    }

    /**
     * Initialize Swagger documentation (non-production only)
     */
    public initializeSwagger(app: Express, serverUrl: string): void {
        if (this.config.NODE_ENV === "production") {
            this.logger.info("Skipping Swagger in production environment");
            return;
        }

        try {
            this.logger.info("Setting up Swagger documentation...");
            swaggerDocs(app, serverUrl);
            this.logger.info("✅ Swagger documentation setup completed");
        } catch (error) {
            this.logger.error(
                "❌ Error setting up Swagger documentation:",
                error,
            );
        }
    }
}
