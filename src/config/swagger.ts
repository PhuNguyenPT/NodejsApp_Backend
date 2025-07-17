// src/config/swagger.ts
import { Express, Request, Response } from "express";
import swaggerJsdoc, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import log from "@/util/logger.js";

import pkg from "../../package.json" with { type: "json" };

const options: Options = {
  apis: ["@/app/routes.ts", "@/entity/*.ts"],
  definition: {
    components: {
      securitySchemes: {
        bearerAuth: {
          bearerFormat: "JWT",
          scheme: "bearer",
          type: "http",
        },
      },
    },
    info: {
      title: "REST API Docs",
      version: pkg.version,
    },
    openapi: "3.0.0",
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app: Express, port: number): void {
  // Swagger page
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get("/docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  log.info(`Docs available at http://localhost:${port.toString()}/docs`);
}

export default swaggerDocs;
