// src/manager/server.manager.ts
import type { Express } from "express";

import { inject, injectable } from "inversify";
import { existsSync, readFileSync } from "node:fs";
import { Server } from "node:http";
import https, { createServer, type ServerOptions } from "node:https";
import { Logger } from "winston";

import type { Config } from "@/config/app.config.js";

import { TYPES } from "@/type/container/types.js";

export interface ServerInstance {
    port: number;
    server: https.Server | null | Server;
    type: "http" | "https";
}

@injectable()
export class ServerManager {
    private isShuttingDown = false;
    private servers: ServerInstance[] = [];

    constructor(
        @inject(TYPES.Config) private readonly config: Config,
        @inject(TYPES.Logger) private readonly logger: Logger,
    ) {}

    /**
     * Get all running servers
     */
    public getServers(): readonly ServerInstance[] {
        return this.servers;
    }

    /**
     * Check if servers are running
     */
    public isRunning(): boolean {
        return this.servers.some((s) => s.server !== null);
    }

    /**
     * Shutdown all servers
     */
    public async shutdown(): Promise<void> {
        if (this.isShuttingDown) {
            this.logger.warn(
                "Server shutdown already in progress, ignoring duplicate signal",
            );
            return;
        }

        this.isShuttingDown = true;
        this.logger.info("📤 Closing all servers...");

        const closePromises = this.servers
            .filter((s) => s.server !== null)
            .map((serverInstance) => this.closeServer(serverInstance));

        try {
            await Promise.all(closePromises);
            this.logger.info("✅ All servers closed successfully");
        } catch (error) {
            this.logger.error("❌ Error closing servers:", error);
            throw error;
        }
    }

    /**
     * Start HTTP server
     */
    public startHttpServer(app: Express): void {
        const httpServer: ServerInstance = {
            port: this.config.SERVER_PORT,
            server: null,
            type: "http",
        };

        const server = app.listen(
            this.config.SERVER_PORT,
            this.config.SERVER_HOSTNAME,
            () => {
                this.logger.info(
                    `🔓 HTTP Server listening on ${this.config.SERVER_HOSTNAME}:${this.config.SERVER_PORT.toString()}${this.config.SERVER_PATH}`,
                );
            },
        );

        // Handle HTTP server errors
        server.on("error", (error: NodeJS.ErrnoException) => {
            this.logger.error("❌ HTTP Server error:", error);

            // If the server failed to bind, remove it from the servers array
            if (error.code === "EADDRINUSE" || error.code === "EACCES") {
                const index = this.servers.indexOf(httpServer);
                if (index > -1) {
                    this.servers.splice(index, 1);
                }
            }
        });

        httpServer.server = server;
        this.servers.push(httpServer);
    }

    /**
     * Start HTTPS/TLS server
     */
    public startTlsServer(app: Express): void {
        try {
            // Check if TLS certificates exist
            if (!existsSync(this.config.TLS_KEY_PATH)) {
                this.logger.warn(
                    `⚠️ TLS key not found at ${this.config.TLS_KEY_PATH}. Skipping HTTPS server...`,
                );
                return;
            }

            if (!existsSync(this.config.TLS_CERT_PATH)) {
                this.logger.warn(
                    `⚠️ TLS certificate not found at ${this.config.TLS_CERT_PATH}. Skipping HTTPS server...`,
                );
                return;
            }

            this.logger.info("🔐 Initializing HTTPS server with TLS...");

            // Read TLS certificates
            const tlsOptions: ServerOptions = {
                ca: readFileSync(this.config.TLS_CA_PATH),
                cert: readFileSync(this.config.TLS_CERT_PATH),
                ciphers: [
                    "ECDHE-ECDSA-AES128-GCM-SHA256",
                    "ECDHE-RSA-AES128-GCM-SHA256",
                    "ECDHE-ECDSA-AES256-GCM-SHA384",
                    "ECDHE-RSA-AES256-GCM-SHA384",
                    "ECDHE-ECDSA-CHACHA20-POLY1305",
                    "ECDHE-RSA-CHACHA20-POLY1305",
                ].join(":"),
                honorCipherOrder: true,
                key: readFileSync(this.config.TLS_KEY_PATH),
                maxVersion: "TLSv1.3" as const,
                minVersion: "TLSv1.2" as const,
                rejectUnauthorized: true,
                requestCert: true,
            };

            const httpsServer: ServerInstance = {
                port: this.config.SERVER_TLS_PORT,
                server: null,
                type: "https",
            };

            const server: https.Server = createServer(tlsOptions, app);

            // Handle HTTPS server errors BEFORE calling listen
            server.on("error", (error: NodeJS.ErrnoException) => {
                if (error.code === "EADDRINUSE") {
                    this.logger.error(
                        `❌ HTTPS port ${this.config.SERVER_TLS_PORT.toString()} is already in use. Skipping HTTPS server...`,
                    );
                } else if (error.code === "EACCES") {
                    this.logger.error(
                        `❌ Permission denied to bind HTTPS port ${this.config.SERVER_TLS_PORT.toString()}. Skipping HTTPS server...`,
                    );
                } else {
                    this.logger.error("❌ HTTPS Server error:", error);
                }

                // Remove from servers array if it was added
                const index = this.servers.indexOf(httpsServer);
                if (index > -1) {
                    this.servers.splice(index, 1);
                }

                // Set server to null to indicate it's not running
                httpsServer.server = null;
            });

            server.listen(
                this.config.SERVER_TLS_PORT,
                this.config.SERVER_HOSTNAME,
                () => {
                    this.logger.info(
                        `🔒 HTTPS Server listening on ${this.config.SERVER_HOSTNAME}:${this.config.SERVER_TLS_PORT.toString()}${this.config.SERVER_PATH}`,
                    );
                },
            );

            // Optional: Log TLS connections for debugging
            server.on("secureConnection", (tlsSocket) => {
                this.logger.debug("🔐 TLS Connection established:", {
                    authorized: tlsSocket.authorized,
                    cipher: tlsSocket.getCipher().name,
                    protocol: tlsSocket.getProtocol(),
                });
            });
            httpsServer.server = server;
            this.servers.push(httpsServer);
        } catch (error) {
            this.logger.error("❌ Failed to start TLS server:", error);
            this.logger.info("ℹ️ Continuing with HTTP only...");
        }
    }

    /**
     * Close a single server
     */
    private async closeServer(serverInstance: ServerInstance): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const serverType = serverInstance.type.toUpperCase();
            this.logger.info(`📤 Closing ${serverType} server...`);

            serverInstance.server?.close((error?: Error) => {
                if (error) {
                    this.logger.error(
                        `❌ Error closing ${serverType} server:`,
                        error,
                    );
                    reject(error);
                } else {
                    this.logger.info(
                        `✅ ${serverType} server closed successfully`,
                    );
                    resolve();
                }
            });
        });
    }
}
