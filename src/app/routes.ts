// src/app/routes.ts
import { Express, Request, Response } from "express";

import type IController from "@/type/interface/controller.interface.js";

/**
 * Registers all controllers' routes into the app with `/api` prefix
 */
export function configureRoutes(
  app: Express,
  controllers: IController[],
): void {
  /**
   * @openapi
   * /health:
   *  get:
   *     tags:
   *     - Health check
   *     description: Responds if the app is up and running
   *     responses:
   *       200:
   *         description: App is up and running
   */
  app.get("/health", (_req: Request, res: Response) => {
    res.sendStatus(200);
  });

  controllers.forEach((controller) => {
    app.use("/api" + controller.path, controller.router);
  });
}
