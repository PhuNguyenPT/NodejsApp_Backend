// src/app/app.ts
import compression from "compression";
import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { AppDataSource } from "@/config/data.source.js";
import ErrorMiddleware from "@/middleware/error.middleware.js";
import Controller from "@/type/interface/controller.interface.js";

class App {
  public express: Application;
  public port: number;

  constructor(controllers: Controller[], port: number) {
    this.express = express();
    this.port = port;

    this.initializeDatabaseConnection();
    this.initializeMiddleware();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  public listen(): void {
    this.express.listen(this.port, () => {
      console.log(`App listening on the port ${this.port.toString()}`);
    });
  }

  private initializeControllers(controllers: Controller[]): void {
    controllers.forEach((controller: Controller) => {
      this.express.use("/api" + controller.path, controller.router); // Use controller.path
    });
  }

  private initializeDatabaseConnection(): void {
    AppDataSource.initialize()
      .then(() => {
        console.log("Database connection established");
      })
      .catch((error: unknown) => {
        console.error("Error during Data Source initialization:", error);
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
}

export default App;
