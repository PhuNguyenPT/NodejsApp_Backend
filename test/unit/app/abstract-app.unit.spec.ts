// test/unit/app/abstract-app.unit.spec.ts
import type { Logger } from "winston";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Config } from "@/config/app.config.js";
import type { LifecycleManager } from "@/manager/lifecycle.manager.js";
import type { MiddlewareManager } from "@/manager/middleware.manager.js";
import type { RouteManager } from "@/manager/route.manager.js";
import type { ServerManager } from "@/manager/server.manager.js";

import { AbstractApp } from "@/app/app.abstract.js";

// Concrete implementation for testing
class TestApp extends AbstractApp {
    public afterInitializeCalled = false;
    public afterListenCalled = false;
    public afterSetupCalled = false;
    public afterShutdownCalled = false;
    public beforeInitializeCalled = false;
    public beforeListenCalled = false;
    public beforeSetupCalled = false;
    public beforeShutdownCalled = false;
    public customSetupCalled = false;

    protected async afterInitialize(): Promise<void> {
        await Promise.resolve();
        this.afterInitializeCalled = true;
    }

    protected afterListen(): void {
        this.afterListenCalled = true;
    }

    protected afterSetup(): void {
        this.afterSetupCalled = true;
    }

    protected async afterShutdown(): Promise<void> {
        await Promise.resolve();
        this.afterShutdownCalled = true;
    }

    protected async beforeInitialize(): Promise<void> {
        await Promise.resolve();
        this.beforeInitializeCalled = true;
    }

    protected beforeListen(): void {
        this.beforeListenCalled = true;
    }

    protected beforeSetup(): void {
        this.beforeSetupCalled = true;
    }

    protected async beforeShutdown(): Promise<void> {
        await Promise.resolve();
        this.beforeShutdownCalled = true;
    }

    protected customSetup(): void {
        this.customSetupCalled = true;
    }
}

describe("AbstractApp", () => {
    let mockConfig: Config;
    let mockLogger: Logger;
    let mockMiddlewareManager: MiddlewareManager;
    let mockRouteManager: RouteManager;
    let mockServerManager: ServerManager;
    let mockLifecycleManager: LifecycleManager;

    // Mock function references
    let loggerInfoMock: ReturnType<typeof vi.fn>;
    let middlewareInitMock: ReturnType<typeof vi.fn>;
    let middlewareErrorMock: ReturnType<typeof vi.fn>;
    let routeSwaggerMock: ReturnType<typeof vi.fn>;
    let routeInitMock: ReturnType<typeof vi.fn>;
    let routeHealthMock: ReturnType<typeof vi.fn>;
    let serverHttpMock: ReturnType<typeof vi.fn>;
    let serverTlsMock: ReturnType<typeof vi.fn>;
    let lifecycleInitMock: ReturnType<typeof vi.fn>;
    let lifecycleShutdownMock: ReturnType<typeof vi.fn>;
    let lifecycleGracefulMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();

        mockConfig = {
            SERVER_HOSTNAME: "localhost",
            SERVER_PATH: "/api",
            SERVER_PORT: 3000,
            SERVER_TLS_PORT: 3443,
        } as Config;

        // Create mock functions
        loggerInfoMock = vi.fn();
        middlewareInitMock = vi.fn();
        middlewareErrorMock = vi.fn();
        routeSwaggerMock = vi.fn();
        routeInitMock = vi.fn();
        routeHealthMock = vi.fn();
        serverHttpMock = vi.fn();
        serverTlsMock = vi.fn();
        lifecycleInitMock = vi.fn().mockResolvedValue(undefined);
        lifecycleShutdownMock = vi.fn().mockResolvedValue(undefined);
        lifecycleGracefulMock = vi.fn();

        mockLogger = {
            debug: vi.fn(),
            error: vi.fn(),
            info: loggerInfoMock,
            warn: vi.fn(),
        } as unknown as Logger;

        mockMiddlewareManager = {
            initialize: middlewareInitMock,
            initializeErrorHandling: middlewareErrorMock,
        } as unknown as MiddlewareManager;

        mockRouteManager = {
            initializeHealthRoute: routeHealthMock,
            initializeRoutes: routeInitMock,
            initializeSwagger: routeSwaggerMock,
        } as unknown as RouteManager;

        mockServerManager = {
            startHttpServer: serverHttpMock,
            startTlsServer: serverTlsMock,
        } as unknown as ServerManager;

        mockLifecycleManager = {
            initialize: lifecycleInitMock,
            setupGracefulShutdown: lifecycleGracefulMock,
            shutdown: lifecycleShutdownMock,
        } as unknown as LifecycleManager;
    });

    describe("Constructor and Setup", () => {
        it("should initialize with correct config values", () => {
            const app = new TestApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(app.port).toBe(3000);
            expect(app.tlsPort).toBe(3443);
            expect(app.hostname).toBe("localhost");
            expect(app.basePath).toBe("/api");
            expect(app.express).toBeDefined();
        });

        it("should call setup methods in correct order", () => {
            const app = new TestApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(loggerInfoMock).toHaveBeenCalledWith(
                "Setting up application...",
            );
            expect(middlewareInitMock).toHaveBeenCalledWith(app.express);
            expect(routeSwaggerMock).toHaveBeenCalled();
            expect(routeInitMock).toHaveBeenCalledWith(app.express, "/api");
            expect(routeHealthMock).toHaveBeenCalled();
            expect(middlewareErrorMock).toHaveBeenCalled();
            expect(lifecycleGracefulMock).toHaveBeenCalled();
            expect(loggerInfoMock).toHaveBeenCalledWith(
                "✅ Application setup completed",
            );
        });

        it("should call lifecycle hooks during setup", () => {
            // Create spies for lifecycle hooks
            const beforeSetupSpy = vi.fn();
            const customSetupSpy = vi.fn();
            const afterSetupSpy = vi.fn();

            class SpyApp extends AbstractApp {
                protected afterSetup(): void {
                    afterSetupSpy();
                }

                protected beforeSetup(): void {
                    beforeSetupSpy();
                }

                protected customSetup(): void {
                    customSetupSpy();
                }
            }

            void new SpyApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(beforeSetupSpy).toHaveBeenCalledTimes(1);
            expect(customSetupSpy).toHaveBeenCalledTimes(1);
            expect(afterSetupSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("getServerUrl", () => {
        it("should return localhost URL when hostname is 0.0.0.0", () => {
            const config = { ...mockConfig, SERVER_HOSTNAME: "0.0.0.0" };
            const app = new TestApp(
                config,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(app.getServerUrl()).toBe("http://localhost:3000/api");
        });

        it("should return localhost URL when hostname is localhost", () => {
            const config = { ...mockConfig, SERVER_HOSTNAME: "localhost" };
            const app = new TestApp(
                config,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(app.getServerUrl()).toBe("http://localhost:3000/api");
        });

        it("should return custom hostname URL", () => {
            const config = {
                ...mockConfig,
                SERVER_HOSTNAME: "api.example.com",
            };
            const app = new TestApp(
                config,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(app.getServerUrl()).toBe("http://api.example.com:3000/api");
        });
    });

    describe("initialize", () => {
        it("should call lifecycle hooks in correct order", async () => {
            const app = new TestApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            await app.initialize();

            expect(app.beforeInitializeCalled).toBe(true);
            expect(lifecycleInitMock).toHaveBeenCalled();
            expect(app.afterInitializeCalled).toBe(true);
        });

        it("should handle async initialization", async () => {
            const asyncInitMock = vi.fn().mockResolvedValue(undefined);
            const asyncMockLifecycleManager = {
                initialize: asyncInitMock,
                setupGracefulShutdown: vi.fn(),
                shutdown: vi.fn().mockResolvedValue(undefined),
            } as unknown as LifecycleManager;

            const app = new TestApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                asyncMockLifecycleManager,
            );

            await expect(app.initialize()).resolves.toBeUndefined();
        });
    });

    describe("listen", () => {
        it("should call lifecycle hooks and start servers", () => {
            const app = new TestApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            app.listen();

            expect(app.beforeListenCalled).toBe(true);
            expect(serverHttpMock).toHaveBeenCalledWith(app.express);
            expect(serverTlsMock).toHaveBeenCalledWith(app.express);
            expect(app.afterListenCalled).toBe(true);
        });
    });

    describe("shutdown", () => {
        it("should call lifecycle hooks in correct order", async () => {
            const app = new TestApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            await app.shutdown();

            expect(app.beforeShutdownCalled).toBe(true);
            expect(lifecycleShutdownMock).toHaveBeenCalled();
            expect(app.afterShutdownCalled).toBe(true);
        });

        it("should handle async shutdown", async () => {
            const asyncShutdownMock = vi.fn().mockResolvedValue(undefined);
            const asyncMockLifecycleManager = {
                initialize: vi.fn().mockResolvedValue(undefined),
                setupGracefulShutdown: vi.fn(),
                shutdown: asyncShutdownMock,
            } as unknown as LifecycleManager;

            const app = new TestApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                asyncMockLifecycleManager,
            );

            await expect(app.shutdown()).resolves.toBeUndefined();
        });
    });

    describe("Custom Implementations", () => {
        it("should allow override of setupDocumentation", () => {
            class CustomApp extends TestApp {
                protected setupDocumentation(): void {
                    // Custom implementation - don't call parent
                }
            }

            void new CustomApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            // Should not have called default implementation
            expect(routeSwaggerMock).not.toHaveBeenCalled();
        });

        it("should allow override of setupMiddleware", () => {
            const customInitialize = vi.fn();
            class CustomApp extends TestApp {
                protected setupMiddleware(): void {
                    customInitialize();
                }
            }

            void new CustomApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(customInitialize).toHaveBeenCalled();
        });

        it("should allow override of startServers", () => {
            const customStart = vi.fn();
            class CustomApp extends TestApp {
                protected startServers(): void {
                    customStart();
                }
            }

            const app = new CustomApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            app.listen();

            expect(customStart).toHaveBeenCalled();
            expect(serverHttpMock).not.toHaveBeenCalled();
        });

        it("should allow override of getServerUrl", () => {
            class CustomApp extends TestApp {
                public getServerUrl(): string {
                    return "https://custom.url";
                }
            }

            const app = new CustomApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(app.getServerUrl()).toBe("https://custom.url");
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty base path", () => {
            const config = { ...mockConfig, SERVER_PATH: "" };
            const app = new TestApp(
                config,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(app.basePath).toBe("");
            expect(app.getServerUrl()).toBe("http://localhost:3000");
        });

        it("should handle different port numbers", () => {
            const config = {
                ...mockConfig,
                SERVER_PORT: 8080,
                SERVER_TLS_PORT: 8443,
            };
            const app = new TestApp(
                config,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(app.port).toBe(8080);
            expect(app.tlsPort).toBe(8443);
            expect(app.getServerUrl()).toBe("http://localhost:8080/api");
        });

        it("should work with minimal lifecycle hooks", () => {
            class MinimalApp extends AbstractApp {}

            const app = new MinimalApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            expect(app).toBeDefined();
            expect(app.express).toBeDefined();
        });
    });

    describe("Full Lifecycle Integration", () => {
        it("should execute complete lifecycle", async () => {
            const app = new TestApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            // Initialize
            await app.initialize();
            expect(app.beforeInitializeCalled).toBe(true);
            expect(app.afterInitializeCalled).toBe(true);

            // Listen
            app.listen();
            expect(app.beforeListenCalled).toBe(true);
            expect(app.afterListenCalled).toBe(true);

            // Shutdown
            await app.shutdown();
            expect(app.beforeShutdownCalled).toBe(true);
            expect(app.afterShutdownCalled).toBe(true);
        });
    });

    describe("Default Lifecycle Hook Implementations", () => {
        it("should handle default empty async hooks", async () => {
            // Use minimal app that doesn't override any hooks
            class MinimalApp extends AbstractApp {}

            const app = new MinimalApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            // These should all resolve without error (empty implementations)
            await expect(app.initialize()).resolves.toBeUndefined();
            await expect(app.shutdown()).resolves.toBeUndefined();
        });

        it("should call default sync lifecycle hooks", () => {
            class MinimalApp extends AbstractApp {}

            const app = new MinimalApp(
                mockConfig,
                mockLogger,
                mockMiddlewareManager,
                mockRouteManager,
                mockServerManager,
                mockLifecycleManager,
            );

            // These should not throw (empty implementations)
            expect(() => {
                app.listen();
            }).not.toThrow();
        });
    });
});
