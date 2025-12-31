// src/manager/middleware.manager.ts
import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import { inject, injectable } from "inversify";
import passport from "passport";
import { Logger } from "winston";

import type { Config } from "@/config/app.config.js";

import { corsOptions } from "@/config/cors.config.js";
import {
    getMorganConfig,
    setupRequestTracking,
} from "@/config/morgan.config.js";
import errorMiddleware from "@/middleware/error-middleware.js";
import { TYPES } from "@/type/container/types.js";

@injectable()
export class MiddlewareManager {
    constructor(
        @inject(TYPES.Config) private readonly config: Config,
        @inject(TYPES.Logger) private readonly logger: Logger,
    ) {}

    /**
     * Initialize all core middleware in correct order
     */
    public initialize(app: Express): void {
        this.logger.info("Initializing all middleware...");

        // 1. Trust proxy settings
        this.configureTrustProxy(app);

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
     * Configure Express trust proxy setting based on TRUST_PROXY_LEVEL
     *
     * This affects how Express parses client IP from proxy headers:
     * - 0/false: req.ip = socket IP (nginx container IP)
     * - 1: req.ip = 1 hop back in X-Forwarded-For
     * - 2: req.ip = 2 hops back in X-Forwarded-For
     * - true: req.ip = leftmost IP in X-Forwarded-For
     *
     * Common infrastructure patterns:
     * - Direct: No proxies → use 0
     * - nginx only: Client → nginx → Node.js → use 1
     * - CDN + nginx: Client → Cloudflare → nginx → Node.js → use 2
     */
    private configureTrustProxy(app: Express): void {
        const trustProxySetting = this.config.TRUST_PROXY_LEVEL;

        app.set("trust proxy", trustProxySetting);

        // Log configuration with helpful context
        if (typeof trustProxySetting === "number") {
            this.logger.info(
                `Trust proxy: ${trustProxySetting.toString()} (trusting ${trustProxySetting.toString()} ${trustProxySetting === 1 ? "proxy" : "proxies"})`,
            );

            if (trustProxySetting === 0) {
                this.logger.debug(
                    "✅ No proxy trust configured - suitable for direct connections (development)",
                );
                this.logger.debug("   • req.ip will show nginx container IP");
                this.logger.debug(
                    "   • Morgan will use CF-Connecting-IP header if available",
                );
            } else if (trustProxySetting === 1) {
                this.logger.info(
                    "✅ Trusting 1 proxy - suitable for nginx-only setup (no CDN)",
                );
                this.logger.debug(
                    "   • Infrastructure: Client → nginx → Node.js",
                );
                this.logger.debug("   • req.ip will show the real client IP");
                this.logger.info(
                    "   ℹ️  If using Cloudflare/CDN + nginx, use TRUST_PROXY_LEVEL=2 instead",
                );
            } else if (trustProxySetting === 2) {
                this.logger.info(
                    "✅ Trusting 2 proxies - suitable for CDN + nginx setup (Cloudflare/other CDN)",
                );
                this.logger.debug(
                    "   • Infrastructure: Client → CDN → nginx → Node.js",
                );
                this.logger.debug("   • req.ip will show the real client IP");
            } else if (trustProxySetting >= 3) {
                this.logger.info(
                    `✅ Trusting ${trustProxySetting.toString()} proxies - suitable for complex proxy chains`,
                );
                this.logger.debug(
                    "   • req.ip will count back from the right of X-Forwarded-For",
                );
                this.logger.warn(
                    "   ⚠️  Verify your proxy chain has exactly this many proxies",
                );
            }
        } else if (trustProxySetting) {
            this.logger.warn("⚠️  Trust proxy: true (trusting ALL proxies)");
            this.logger.warn(
                "   • req.ip will use the leftmost IP in X-Forwarded-For",
            );
            this.logger.warn(
                "   • Security risk: This can be spoofed if not behind a verified CDN",
            );
            this.logger.info(
                "   ℹ️  Consider using a specific number (e.g., TRUST_PROXY_LEVEL=2) instead",
            );
        } else {
            this.logger.info(
                "✅ Trust proxy: false (not trusting any proxies)",
            );
            this.logger.debug("   • req.ip will show the direct connection IP");
            this.logger.debug(
                "   • Use this for development or when explicitly reading CF-Connecting-IP header",
            );
        }
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
