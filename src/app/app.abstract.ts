// src/app/app.abstract.ts
import type { Logger } from "winston";

import express, { Express } from "express";
import { injectable, unmanaged } from "inversify";

import type { Config } from "@/config/app.config.js";
import type { LifecycleManager } from "@/manager/lifecycle.manager.js";
import type { MiddlewareManager } from "@/manager/middleware.manager.js";
import type { RouteManager } from "@/manager/route.manager.js";
import type { ServerManager } from "@/manager/server.manager.js";

@injectable()
export abstract class AbstractApp {
    public readonly basePath: string;
    public readonly express: Express;
    public readonly hostname: string;
    public readonly port: number;
    public readonly tlsPort: number;

    constructor(
        @unmanaged() readonly config: Config,
        @unmanaged() protected readonly logger: Logger,
        @unmanaged() protected readonly middlewareManager: MiddlewareManager,
        @unmanaged() protected readonly routeManager: RouteManager,
        @unmanaged() protected readonly serverManager: ServerManager,
        @unmanaged() protected readonly lifecycleManager: LifecycleManager,
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
     * Get server URL - can be overridden for custom URL generation
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
        await this.beforeInitialize();
        await this.lifecycleManager.initialize();
        await this.afterInitialize();
    }

    /**
     * Start listening on configured ports
     */
    public listen(): void {
        this.beforeListen();
        this.startServers();
        this.afterListen();
    }

    /**
     * Graceful shutdown
     */
    public async shutdown(): Promise<void> {
        await this.beforeShutdown();
        await this.lifecycleManager.shutdown();
        await this.afterShutdown();
    }

    /**
     * Called after async initialization completes
     */
    protected async afterInitialize(): Promise<void> {
        // Optional hook - override in subclasses if needed
    }

    /**
     * Called after servers start listening
     */
    protected afterListen(): void {
        // Optional hook - override in subclasses if needed
    }

    /**
     * Called after setup completes
     */
    protected afterSetup(): void {
        // Optional hook - override in subclasses if needed
    }

    /**
     * Called after shutdown completes
     */
    protected async afterShutdown(): Promise<void> {
        // Optional hook - override in subclasses if needed
    }

    /**
     * Called before async initialization
     */
    protected async beforeInitialize(): Promise<void> {
        // Optional hook - override in subclasses if needed
    }

    /**
     * Called before servers start listening
     */
    protected beforeListen(): void {
        // Optional hook - override in subclasses if needed
    }

    /**
     * Called before setup begins
     */
    protected beforeSetup(): void {
        // Optional hook - override in subclasses if needed
    }

    /**
     * Called before shutdown begins
     */
    protected async beforeShutdown(): Promise<void> {
        // Optional hook - override in subclasses if needed
    }

    // --- Lifecycle hooks for subclasses ---

    /**
     * Called after basic setup but before error handling
     * Use this to add custom middleware or routes
     */
    protected customSetup(): void {
        // Optional hook - override in subclasses if needed
    }

    /**
     * Setup documentation - can be overridden to customize documentation setup
     */
    protected setupDocumentation(): void {
        this.routeManager.initializeSwagger(this.express, this.getServerUrl());
    }

    /**
     * Setup error handling - can be overridden to customize error handling
     */
    protected setupErrorHandling(): void {
        this.middlewareManager.initializeErrorHandling(this.express);
    }

    /**
     * Setup graceful shutdown - can be overridden to customize shutdown behavior
     */
    protected setupGracefulShutdown(): void {
        this.lifecycleManager.setupGracefulShutdown();
    }

    /**
     * Setup health checks - can be overridden to customize health check setup
     */
    protected setupHealthChecks(): void {
        this.routeManager.initializeHealthRoute(this.express);
    }

    /**
     * Setup middleware - can be overridden to customize middleware initialization
     */
    protected setupMiddleware(): void {
        this.middlewareManager.initialize(this.express);
    }

    /**
     * Setup routes - can be overridden to customize route initialization
     */
    protected setupRoutes(): void {
        this.routeManager.initializeRoutes(this.express, this.basePath);
    }

    /**
     * Start servers - can be overridden to customize server startup
     */
    protected startServers(): void {
        this.serverManager.startHttpServer(this.express);
        this.serverManager.startTlsServer(this.express);
    }

    /**
     * Setup application in the correct order
     * Template method that defines the application setup flow
     */
    private setupApplication(): void {
        this.logger.info("Setting up application...");

        this.beforeSetup();

        // Initialize core middleware
        this.setupMiddleware();

        // Initialize documentation
        this.setupDocumentation();

        // Initialize routes
        this.setupRoutes();

        // Initialize health checks
        this.setupHealthChecks();

        // Custom setup hook
        this.customSetup();

        // Initialize error handling (must be last)
        this.setupErrorHandling();

        // Setup graceful shutdown handlers
        this.setupGracefulShutdown();

        this.afterSetup();

        this.logger.info("✅ Application setup completed");
    }
}

export default AbstractApp;
