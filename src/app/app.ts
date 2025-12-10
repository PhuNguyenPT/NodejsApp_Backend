// src/app/app.ts
import type { Logger } from "winston";

import { inject, injectable } from "inversify";

import type { Config } from "@/config/app.config.js";
import type { LifecycleManager } from "@/manager/lifecycle.manager.js";
import type { MiddlewareManager } from "@/manager/middleware.manager.js";
import type { RouteManager } from "@/manager/route.manager.js";
import type { ServerManager } from "@/manager/server.manager.js";

import { AbstractApp } from "@/app/app.abstract.js";
import { TYPES } from "@/type/container/types.js";

@injectable()
export class App extends AbstractApp {
    constructor(
        @inject(TYPES.Config) config: Config,
        @inject(TYPES.Logger) logger: Logger,
        @inject(TYPES.MiddlewareManager) middlewareManager: MiddlewareManager,
        @inject(TYPES.RouteManager) routeManager: RouteManager,
        @inject(TYPES.ServerManager) serverManager: ServerManager,
        @inject(TYPES.LifecycleManager) lifecycleManager: LifecycleManager,
    ) {
        super(
            config,
            logger,
            middlewareManager,
            routeManager,
            serverManager,
            lifecycleManager,
        );
    }
}
