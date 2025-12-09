// src/app/app.ts
import express, { Express } from "express";
import { inject, injectable } from "inversify";
import { Logger } from "winston";

import { Config } from "@/config/app.config.js";
import { LifecycleManager } from "@/manager/lifecycle.manager.js";
import { MiddlewareManager } from "@/manager/middleware.manager.js";
import { RouteManager } from "@/manager/route.manager.js";
import { ServerManager } from "@/manager/server.manager.js";
import { TYPES } from "@/type/container/types.js";

@injectable()
class App {
    public readonly basePath: string;
    public readonly express: Express;
    public readonly hostname: string;
    public readonly port: number;
    public readonly tlsPort: number;

    constructor(
        @inject(TYPES.Config) readonly config: Config,
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.MiddlewareManager)
        private readonly middlewareManager: MiddlewareManager,
        @inject(TYPES.RouteManager)
        private readonly routeManager: RouteManager,
        @inject(TYPES.ServerManager)
        private readonly serverManager: ServerManager,
        @inject(TYPES.LifecycleManager)
        private readonly lifecycleManager: LifecycleManager,
    ) {
        this.express = express();
        this.port = config.SERVER_PORT;
        this.tlsPort = config.SERVER_TLS_PORT;
        this.hostname = config.SERVER_HOSTNAME;
        this.basePath = config.SERVER_PATH;

        // Setup synchronous components
        this.setupApplication();
    }

    /**
     * Get server URL for Swagger
     */
    public getServerUrl(): string {
        if (this.hostname === "0.0.0.0" || this.hostname === "localhost") {
            return `http://localhost:${this.port.toString()}${this.basePath}`;
        }
        return `http://${this.hostname}:${this.port.toString()}${this.basePath}`;
    }

    /**
     * Initialize all async components
     */
    public async initialize(): Promise<void> {
        await this.lifecycleManager.initialize();
    }

    /**
     * Start listening on configured ports
     */
    public listen(): void {
        this.serverManager.startHttpServer(this.express);
        this.serverManager.startTlsServer(this.express);
    }

    /**
     * Graceful shutdown
     */
    public async shutdown(): Promise<void> {
        await this.lifecycleManager.shutdown();
    }

    /**
     * Setup application (middleware, routes, error handling)
     */
    private setupApplication(): void {
        this.logger.info("Setting up application...");

        // Initialize core middleware (CORS, body parsing, compression, etc.)
        this.middlewareManager.initialize(this.express);

        // Initialize Swagger documentation
        this.routeManager.initializeSwagger(this.express, this.getServerUrl());

        // Initialize API routes with security middleware
        this.routeManager.initializeRoutes(this.express, this.basePath);

        // Initialize health check route
        this.routeManager.initializeHealthRoute(this.express);

        // Initialize error handling (must be last)
        this.middlewareManager.initializeErrorHandling(this.express);

        // Setup graceful shutdown handlers
        this.lifecycleManager.setupGracefulShutdown();

        this.logger.info("✅ Application setup completed");
    }
}

export default App;
