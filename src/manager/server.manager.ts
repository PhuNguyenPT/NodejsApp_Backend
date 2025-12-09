// src/manager/server.manager.ts
import { Express } from "express";
import fs from "fs";
import { Server } from "http";
import https from "https";
import { inject, injectable } from "inversify";
import { Logger } from "winston";

import { Config } from "@/config/app.config.js";
import { TYPES } from "@/type/container/types.js";

export interface ServerInstance {
    name: string;
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
            name: "HTTP",
            port: this.config.SERVER_PORT,
            server: null,
            type: "http",
        };

        httpServer.server = app.listen(
            this.config.SERVER_PORT,
            this.config.SERVER_HOSTNAME,
            () => {
                this.logger.info(
                    `🔓 HTTP Server listening on ${this.config.SERVER_HOSTNAME}:${this.config.SERVER_PORT.toString()}${this.config.SERVER_PATH}`,
                );
            },
        );

        // Handle HTTP server errors
        httpServer.server.on("error", (error: NodeJS.ErrnoException) => {
            this.logger.error("❌ HTTP Server error:", error);

            // If the server failed to bind, remove it from the servers array
            if (error.code === "EADDRINUSE" || error.code === "EACCES") {
                const index = this.servers.indexOf(httpServer);
                if (index > -1) {
                    this.servers.splice(index, 1);
                }
            }
        });

        this.servers.push(httpServer);
    }

    /**
     * Start HTTPS/TLS server
     */
    public startTlsServer(app: Express): void {
        try {
            // Check if TLS certificates exist
            if (!fs.existsSync(this.config.TLS_KEY_PATH)) {
                this.logger.warn(
                    `⚠️ TLS key not found at ${this.config.TLS_KEY_PATH}. Skipping HTTPS server...`,
                );
                return;
            }

            if (!fs.existsSync(this.config.TLS_CERT_PATH)) {
                this.logger.warn(
                    `⚠️ TLS certificate not found at ${this.config.TLS_CERT_PATH}. Skipping HTTPS server...`,
                );
                return;
            }

            this.logger.info("🔐 Initializing HTTPS server with TLS...");

            // Read TLS certificates
            const tlsOptions: https.ServerOptions = {
                ca: fs.readFileSync(this.config.TLS_CA_PATH),
                cert: fs.readFileSync(this.config.TLS_CERT_PATH),
                ciphers: [
                    "ECDHE-ECDSA-AES128-GCM-SHA256",
                    "ECDHE-RSA-AES128-GCM-SHA256",
                    "ECDHE-ECDSA-AES256-GCM-SHA384",
                    "ECDHE-RSA-AES256-GCM-SHA384",
                    "ECDHE-ECDSA-CHACHA20-POLY1305",
                    "ECDHE-RSA-CHACHA20-POLY1305",
                ].join(":"),
                honorCipherOrder: true,
                key: fs.readFileSync(this.config.TLS_KEY_PATH),
                maxVersion: "TLSv1.3" as const,
                minVersion: "TLSv1.2" as const,
                rejectUnauthorized: true,
                requestCert: true,
            };

            const httpsServer: ServerInstance = {
                name: "HTTPS",
                port: this.config.SERVER_TLS_PORT,
                server: null,
                type: "https",
            };

            httpsServer.server = https.createServer(tlsOptions, app);

            // Handle HTTPS server errors BEFORE calling listen
            httpsServer.server.on("error", (error: NodeJS.ErrnoException) => {
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

            httpsServer.server.listen(
                this.config.SERVER_TLS_PORT,
                this.config.SERVER_HOSTNAME,
                () => {
                    this.logger.info(
                        `🔒 HTTPS Server listening on ${this.config.SERVER_HOSTNAME}:${this.config.SERVER_TLS_PORT.toString()}${this.config.SERVER_PATH}`,
                    );
                },
            );

            // Optional: Log TLS connections for debugging
            if (this.config.NODE_ENV === "development") {
                (httpsServer.server as https.Server).on(
                    "secureConnection",
                    (tlsSocket) => {
                        this.logger.debug("🔐 TLS Connection established:", {
                            authorized: tlsSocket.authorized,
                            cipher: tlsSocket.getCipher().name,
                            protocol: tlsSocket.getProtocol(),
                        });
                    },
                );
            }

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
            this.logger.info(`📤 Closing ${serverInstance.name} server...`);

            serverInstance.server?.close((error?: Error) => {
                if (error) {
                    this.logger.error(
                        `❌ Error closing ${serverInstance.name} server:`,
                        error,
                    );
                    reject(error);
                } else {
                    this.logger.info(
                        `✅ ${serverInstance.name} server closed successfully`,
                    );
                    resolve();
                }
            });
        });
    }
}
