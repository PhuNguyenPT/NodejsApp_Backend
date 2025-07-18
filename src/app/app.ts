// src/app/app.ts
import compression from "compression";
import cors from "cors";
import express, { Express, Router } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { AppDataSource } from "@/config/data.source.js";
import { RegisterRoutes } from "@/generated/routes.js";
import ErrorMiddleware from "@/middleware/error.middleware.js";
import logger from "@/util/logger.js";

class App {
  public basePath!: string;
  public express!: Express;
  public hostname!: string;
  public port!: number;

  constructor(port: number, hostname: string, basePath: string) {
    this.express = express();
    this.port = port;
    this.hostname = hostname;
    this.basePath = basePath;

    this.initializeDatabaseConnection();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  public getServerUrl(): string {
    return `http://${this.hostname}:${this.port.toString()}${this.basePath}`;
  }

  public listen(): void {
    this.express.listen(this.port, this.hostname, () => {
      logger.info(
        `App listening on ${this.hostname}:${this.port.toString()}${this.basePath}`,
      );
    });
  }

  private initializeDatabaseConnection(): void {
    AppDataSource.initialize()
      .then(() => {
        logger.info("Database connection established");
      })
      .catch((error: unknown) => {
        logger.error("Error during Data Source initialization:", error);
      });
  }

  private initializeErrorHandling(): void {
    this.express.use(ErrorMiddleware);
  }

  private initializeMiddleware(): void {
    this.express.use(helmet());
    this.express.use(cors());
    this.express.use(morgan("dev"));
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use(compression());
  }

  private initializeRoutes(): void {
    // Create a router for the API base path
    const apiRouter: Router = express.Router();

    // Register TSOA routes to the API router
    RegisterRoutes(apiRouter);

    // Mount the API router at the base path
    this.express.use(this.basePath, apiRouter);

    this.express.get("/health", (req, res) => {
      res.json({
        basePath: this.basePath,
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    });
  }
}

export default App;
