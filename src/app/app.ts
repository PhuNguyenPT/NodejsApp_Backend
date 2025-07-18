// src/app/app.ts
import compression from "compression";
import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { AppDataSource } from "@/config/data.source.js";
import { RegisterRoutes } from "@/generated/routes.js";
import ErrorMiddleware from "@/middleware/error.middleware.js";
import logger from "@/util/logger.js";

class App {
  public express: Express;
  public port: number;

  constructor(port: number) {
    this.express = express();
    this.port = port;

    this.initializeDatabaseConnection();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  public listen(): void {
    this.express.listen(this.port, () => {
      logger.info(`App listening on the port ${this.port.toString()}`);
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
    RegisterRoutes(this.express.router);
  }
}
export default App;
