// src/manager/middleware.manager.ts
import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import { inject, injectable } from "inversify";
import passport from "passport";
import { Logger } from "winston";

import { corsOptions } from "@/config/cors.config.js";
import {
    getMorganConfig,
    setupRequestTracking,
} from "@/config/morgan.config.js";
import errorMiddleware from "@/middleware/error-middleware.js";
import { TYPES } from "@/type/container/types.js";

@injectable()
export class MiddlewareManager {
    constructor(@inject(TYPES.Logger) private readonly logger: Logger) {}

    /**
     * Initialize all core middleware in correct order
     */
    public initialize(app: Express): void {
        this.logger.info("Initializing all middleware...");

        // 1. Trust proxy settings
        app.set("trust proxy", 1);

        // 2. Request tracking (must come first for proper logging)
        this.initializeRequestTracking(app);

        // 3. Logging middleware
        this.initializeMorganLogging(app);

        // 4. CORS
        this.initializeCors(app);

        // 5. Body parsing
        this.initializeBodyParsing(app);

        // 6. Compression
        this.initializeCompression(app);

        // 7. Passport
        this.initializePassport(app);

        this.logger.info("✅ All middleware initialized successfully");
    }

    /**
     * Initialize error handling middleware (must be registered last)
     */
    public initializeErrorHandling(app: Express): void {
        this.logger.info("Initializing error handling middleware...");
        app.use(errorMiddleware);
        this.logger.info(
            "✅ Error handling middleware initialized successfully",
        );
    }

    /**
     * Initialize body parsing middleware
     */
    private initializeBodyParsing(app: Express): void {
        app.use(express.json({ limit: "10mb" }));
        app.use(express.urlencoded({ extended: false, limit: "10mb" }));
        this.logger.debug("Body parsing middleware initialized");
    }

    /**
     * Initialize compression middleware
     */
    private initializeCompression(app: Express): void {
        app.use(compression());
        this.logger.debug("Compression middleware initialized");
    }

    /**
     * Initialize CORS middleware
     */
    private initializeCors(app: Express): void {
        app.use(cors(corsOptions));
        this.logger.debug("CORS middleware initialized");
    }

    /**
     * Initialize Morgan logging middleware
     */
    private initializeMorganLogging(app: Express): void {
        const morganMiddlewares = getMorganConfig();
        morganMiddlewares.forEach((middleware) => {
            app.use(middleware);
        });
        this.logger.debug("Morgan logging middleware initialized");
    }

    /**
     * Initialize Passport middleware
     */
    private initializePassport(app: Express): void {
        app.use(passport.initialize());
        this.logger.debug("Passport middleware initialized");
    }

    /**
     * Initialize request tracking middleware
     */
    private initializeRequestTracking(app: Express): void {
        app.use(setupRequestTracking());
        this.logger.debug("Request tracking middleware initialized");
    }
}
