// test/integration/app/index.integration.spec.ts
import "reflect-metadata";

import type { JsonObject } from "swagger-ui-express";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type AbstractApp from "@/app/app.abstract.js";

import { logger } from "@/config/logger.config.js";
import { TYPES } from "@/type/container/types.js";
import { createSafeConfig } from "@/util/validate-env.js";

interface OpenAPISpec extends JsonObject {
    info: {
        description?: string;
        title: string;
        version: string;
    };
    openapi: string;
    paths: Record<string, unknown>;
    servers?: {
        description?: string;
        url: string;
    }[];
}

describe("Application Bootstrap Integration", () => {
    let app: AbstractApp;
    let serverUrl: string;
    let baseUrl: string;

    beforeAll(async () => {
        // Import and get the real container
        const { iocContainer } = await import("@/app/ioc-container.js");

        // Get the app instance (already initialized in test/setup.ts)
        app = iocContainer.get<AbstractApp>(TYPES.App);

        // Start the server
        app.listen();

        // Get the server URL (e.g., http://localhost:3000/api)
        serverUrl = app.getServerUrl();

        // Get root URL without /api basePath (e.g., http://localhost:3000)
        baseUrl = serverUrl.replace(/\/api$/, "");
    });

    afterAll(async () => {
        // Shutdown the app
        await app.shutdown();
    });

    describe("Bootstrap Process", () => {
        it("should have container initialized", async () => {
            const { iocContainer } = await import("@/app/ioc-container.js");
            expect(iocContainer).toBeDefined();
        });

        it("should create safe config for logging", () => {
            const safeConfig = createSafeConfig();

            expect(safeConfig).toBeDefined();
            expect(safeConfig.NODE_ENV).toBeDefined();
            expect(safeConfig.SERVER_PORT).toBeDefined();

            // Verify sensitive data is hidden (replaced with [HIDDEN])
            expect(safeConfig.ADMIN_PASSWORD).toBe("[HIDDEN]");
            expect(safeConfig.MISTRAL_API_KEY).toBe("[HIDDEN]");
            expect(safeConfig.POSTGRES_PASSWORD).toBe("[HIDDEN]");
            expect(safeConfig.REDIS_PASSWORD).toBe("[HIDDEN]");
            expect(safeConfig.REDIS_USER_PASSWORD).toBe("[HIDDEN]");
        });

        it("should have logger configured", () => {
            expect(logger).toBeDefined();
            expect(typeof logger.info).toBe("function");
            expect(typeof logger.error).toBe("function");
            expect(typeof logger.warn).toBe("function");
            expect(typeof logger.debug).toBe("function");
        });
    });

    describe("Container Configuration", () => {
        it("should have all required bindings in the container", async () => {
            const { iocContainer } = await import("@/app/ioc-container.js");

            // Test that key services can be resolved
            expect(() => iocContainer.get(TYPES.App)).not.toThrow();
            expect(() => iocContainer.get(TYPES.Config)).not.toThrow();
            expect(() => iocContainer.get(TYPES.Logger)).not.toThrow();
            expect(() => iocContainer.get(TYPES.DataSource)).not.toThrow();
            expect(() => iocContainer.get(TYPES.RedisPublisher)).not.toThrow();
            expect(() => iocContainer.get(TYPES.RedisSubscriber)).not.toThrow();
        });

        it("should resolve managers from container", async () => {
            const { iocContainer } = await import("@/app/ioc-container.js");

            expect(() => iocContainer.get(TYPES.DatabaseManager)).not.toThrow();
            expect(() => iocContainer.get(TYPES.ServerManager)).not.toThrow();
            expect(() =>
                iocContainer.get(TYPES.MiddlewareManager),
            ).not.toThrow();
            expect(() => iocContainer.get(TYPES.RouteManager)).not.toThrow();
            expect(() =>
                iocContainer.get(TYPES.LifecycleManager),
            ).not.toThrow();
        });

        it("should maintain singleton scope for app", async () => {
            const { iocContainer } = await import("@/app/ioc-container.js");

            const app1 = iocContainer.get<AbstractApp>(TYPES.App);
            const app2 = iocContainer.get<AbstractApp>(TYPES.App);

            expect(app1).toBe(app2);
        });
    });

    describe("Application Instance", () => {
        it("should have properly configured app instance", () => {
            expect(app.express).toBeDefined();
            expect(typeof app.express).toBe("function");
            expect(app.port).toBeGreaterThan(0);
            expect(app.tlsPort).toBeGreaterThan(0);
            expect(typeof app.hostname).toBe("string");
            expect(typeof app.basePath).toBe("string");
        });

        it("should generate valid server URL", () => {
            expect(serverUrl).toBeDefined();
            expect(serverUrl).toContain("http");
            expect(serverUrl).toContain(app.basePath);
            expect(typeof serverUrl).toBe("string");
        });

        it("should have lifecycle methods", () => {
            expect(typeof app.shutdown).toBe("function");
            expect(typeof app.initialize).toBe("function");
            expect(typeof app.listen).toBe("function");
        });
    });

    describe("Swagger Documentation", () => {
        it("should serve Swagger UI at /api/swagger-ui/", async () => {
            const response = await fetch(`${baseUrl}/api/swagger-ui/`);

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);
            const html = await response.text();
            expect(html).toContain("swagger-ui");
        });

        it("should serve Swagger UI at /swagger-ui/", async () => {
            const response = await fetch(`${baseUrl}/swagger-ui/`);

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);
        });

        it("should serve OpenAPI spec at /api/v3/api-docs", async () => {
            const response = await fetch(`${baseUrl}/api/v3/api-docs`);

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);
            expect(response.headers.get("content-type")).toContain(
                "application/json",
            );

            const spec = (await response.json()) as OpenAPISpec;
            expect(spec).toBeDefined();
            expect(spec.openapi).toBeDefined();
            expect(spec.info).toBeDefined();
            expect(spec.servers).toBeDefined();
            expect(spec.servers?.[0]?.url).toBe(serverUrl);
        });

        it("should serve OpenAPI spec at /api-docs", async () => {
            const response = await fetch(`${baseUrl}/api-docs`);

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);
            expect(response.headers.get("content-type")).toContain(
                "application/json",
            );
        });

        it("should redirect root / to Swagger UI", async () => {
            const response = await fetch(`${baseUrl}/`, {
                redirect: "manual",
            });

            expect(response.status).toBe(302);
            expect(response.headers.get("location")).toBe("/api/swagger-ui/");
        });
    });
});
