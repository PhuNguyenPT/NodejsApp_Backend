// test/unit/app/index.unit.spec.ts
import type { MockInstance } from "vitest";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Bootstrap Entry Point", () => {
    let mockLogger: {
        error: ReturnType<typeof vi.fn>;
        info: ReturnType<typeof vi.fn>;
    };
    let mockApp: {
        getServerUrl: ReturnType<typeof vi.fn>;
        initialize: ReturnType<typeof vi.fn>;
        listen: ReturnType<typeof vi.fn>;
    };
    let mockIocContainer: {
        get: ReturnType<typeof vi.fn>;
    };
    let mockCreateSafeConfig: ReturnType<typeof vi.fn>;
    let processExitSpy: MockInstance;
    let consoleErrorSpy: MockInstance;

    beforeEach(() => {
        // Mock logger
        mockLogger = {
            error: vi.fn(),
            info: vi.fn(),
        };

        // Mock app instance
        mockApp = {
            getServerUrl: vi.fn().mockReturnValue("http://localhost:3000/api"),
            initialize: vi.fn().mockResolvedValue(undefined),
            listen: vi.fn(),
        };

        // Mock IoC container
        mockIocContainer = {
            get: vi.fn().mockReturnValue(mockApp),
        };

        // Mock createSafeConfig
        mockCreateSafeConfig = vi.fn().mockReturnValue({
            NODE_ENV: "test",
            SERVER_PORT: 3000,
        });

        // Spy on process.exit - don't throw, just prevent actual exit
        processExitSpy = vi
            .spyOn(process, "exit")
            .mockImplementation((_code?: null | number | string): never => {
                // Don't throw - just return to prevent actual process exit
                // TypeScript requires 'never' return type, but we won't actually exit
                return undefined as never;
            });

        // Spy on console.error
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
            // Intentionally empty to suppress console.error during tests
        });

        // Mock modules
        vi.doMock("@/config/logger.config.js", () => ({
            logger: mockLogger,
        }));

        vi.doMock("@/util/validate-env.js", () => ({
            createSafeConfig: mockCreateSafeConfig,
        }));

        vi.doMock("@/app/ioc-container.js", () => ({
            iocContainer: mockIocContainer,
        }));

        vi.doMock("@/type/container/types.js", () => ({
            TYPES: {
                App: Symbol.for("App"),
            },
        }));
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        processExitSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe("Successful Bootstrap", () => {
        it("should start application successfully", async () => {
            // Import after mocks are set up
            await import("@/app/index.js");

            // Wait for async bootstrap - check for the second logger call
            await vi.waitFor(() => {
                expect(mockLogger.info).toHaveBeenCalledTimes(2);
            });

            expect(mockLogger.info).toHaveBeenNthCalledWith(
                1,
                "Starting application",
                expect.any(Object),
            );
            expect(mockCreateSafeConfig).toHaveBeenCalled();
            expect(mockIocContainer.get).toHaveBeenCalled();
            expect(mockApp.initialize).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenNthCalledWith(
                2,
                "Server will be available at: http://localhost:3000/api",
            );
            expect(mockApp.listen).toHaveBeenCalled();
        });

        it("should log safe config on startup", async () => {
            const safeConfig = { NODE_ENV: "test", SERVER_PORT: 3000 };
            mockCreateSafeConfig.mockReturnValue(safeConfig);

            await import("@/app/index.js");

            await vi.waitFor(() => {
                expect(mockLogger.info).toHaveBeenCalledWith(
                    "Starting application",
                    safeConfig,
                );
            });
        });

        it("should call app methods in correct order", async () => {
            const callOrder: string[] = [];

            mockApp.initialize.mockImplementation(async () => {
                await Promise.resolve();
                callOrder.push("initialize");
            });
            mockApp.getServerUrl.mockImplementation(() => {
                callOrder.push("getServerUrl");
                return "http://localhost:3000/api";
            });
            mockApp.listen.mockImplementation(() => {
                callOrder.push("listen");
            });

            await import("@/app/index.js");

            await vi.waitFor(() => {
                expect(callOrder).toEqual([
                    "initialize",
                    "getServerUrl",
                    "listen",
                ]);
            });
        });
    });

    describe("Error Handling", () => {
        it("should handle initialization errors", async () => {
            const error = new Error("Initialization failed");
            mockApp.initialize.mockRejectedValue(error);

            await import("@/app/index.js");

            await vi.waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Error starting server:",
                    error,
                );
                expect(processExitSpy).toHaveBeenCalledWith(1);
            });
        });

        it("should handle container resolution errors", async () => {
            const error = new Error("Container error");
            mockIocContainer.get.mockImplementation(() => {
                throw error;
            });

            await import("@/app/index.js");

            await vi.waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Error starting server:",
                    error,
                );
                expect(processExitSpy).toHaveBeenCalledWith(1);
            });
        });

        it("should handle app.listen errors", async () => {
            const error = new Error("Listen failed");
            mockApp.listen.mockImplementation(() => {
                throw error;
            });

            await import("@/app/index.js");

            await vi.waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Error starting server:",
                    error,
                );
                expect(processExitSpy).toHaveBeenCalledWith(1);
            });
        });

        it("should handle bootstrap promise rejection", async () => {
            mockLogger.info.mockImplementation(() => {
                throw new Error("Logger error");
            });

            await import("@/app/index.js");

            await vi.waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    "Error starting server:",
                    expect.any(Error),
                );
                expect(processExitSpy).toHaveBeenCalledWith(1);
            });
        });
    });

    describe("Module Imports", () => {
        it("should dynamically import ioc-container", async () => {
            const importSpy = vi.fn().mockResolvedValue({
                iocContainer: mockIocContainer,
            });

            vi.doMock("@/app/ioc-container.js", importSpy);

            await import("@/app/index.js");

            await vi.waitFor(() => {
                expect(mockIocContainer.get).toHaveBeenCalled();
            });
        });
    });
});
