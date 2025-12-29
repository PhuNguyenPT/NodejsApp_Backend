// src/config/swagger.ts
import type { Express, Request, Response } from "express";

import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { swaggerHelmetOptions } from "@/config/helmet.config.js";
import { logger } from "@/config/logger.config.js";
import swaggerJson from "@/generated/swagger.json" with { type: "json" };

// The imported JSON is a mutable object, so we can modify it.
const swaggerSpec = swaggerJson;

function swaggerDocs(app: Express, serverUrl: string): void {
    // Dynamically set the server URL in the Swagger spec
    const serverObject = { description: "Server", url: serverUrl };
    swaggerSpec.servers = [serverObject];

    logger.info("Applying Swagger-specific CSP policies...");

    const helmetMiddleware = helmet(swaggerHelmetOptions);

    // Apply Helmet and Swagger UI middleware in a single chain
    app.use(
        "/api/swagger-ui",
        helmetMiddleware,
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec),
    );
    app.use(
        "/swagger-ui",
        helmetMiddleware,
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec),
    );

    // Apply Helmet middleware to the spec endpoints
    app.get(
        "/api/v3/api-docs",
        helmetMiddleware,
        (_req: Request, res: Response) => {
            res.setHeader("Content-Type", "application/json");
            res.send(swaggerSpec);
        },
    );

    app.get("/api-docs", helmetMiddleware, (_req: Request, res: Response) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });

    // Root redirect to swagger-ui (like Spring Boot)
    app.get("/", (_req: Request, res: Response) => {
        res.redirect("/api/swagger-ui/");
    });

    // Log available endpoints
    const baseUrl = serverUrl.replace(/\/api$/, ""); // Safely remove a potential trailing /api
    logger.info(`Swagger UI available at:`);
    logger.info(`  - ${baseUrl}/api/swagger-ui/`);
    logger.info(`  - ${baseUrl}/swagger-ui/`);
    logger.info(`OpenAPI spec available at:`);
    logger.info(`  - ${baseUrl}/api/v3/api-docs`);
    logger.info(`  - ${baseUrl}/api-docs`);
}
export default swaggerDocs;
