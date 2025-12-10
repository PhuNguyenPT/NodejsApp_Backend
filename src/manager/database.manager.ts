import type { RedisClientType } from "redis";

// src/manager/database.manager.ts
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { Logger } from "winston";

import type { Config } from "@/config/app.config.js";

import { TYPES } from "@/type/container/types.js";

export interface DatabaseConnection {
    instance: DataSource | RedisClientType;
    name: string;
    type: "postgres" | "redis";
}

@injectable()
export class DatabaseManager {
    private connections: DatabaseConnection[] = [];
    private initialized = false;

    constructor(
        @inject(TYPES.Config) readonly config: Config,
        @inject(TYPES.Logger) private readonly logger: Logger,
        @inject(TYPES.DataSource) private readonly dataSource: DataSource,
        @inject(TYPES.RedisPublisher)
        private readonly redisPublisher: RedisClientType,
        @inject(TYPES.RedisSubscriber)
        private readonly redisSubscriber: RedisClientType,
    ) {
        // Register all database connections
        this.registerConnection({
            instance: this.dataSource,
            name: "PostgreSQL",
            type: "postgres",
        });

        this.registerConnection({
            instance: this.redisPublisher,
            name: "Redis Publisher",
            type: "redis",
        });

        this.registerConnection({
            instance: this.redisSubscriber,
            name: "Redis Subscriber",
            type: "redis",
        });
    }

    /**
     * Close all database connections
     */
    public async closeAll(): Promise<void> {
        if (!this.initialized) {
            this.logger.info("ℹ️ No active database connections to close");
            return;
        }

        this.logger.info("🔌 Closing all database connections...");

        const closePromises = this.connections.map((connection) =>
            this.closeConnection(connection),
        );

        try {
            await Promise.all(closePromises);
            this.initialized = false;
            this.logger.info("✅ All database connections closed successfully");
        } catch (error) {
            this.logger.error("❌ Error closing database connections:", error);
            throw error;
        }
    }

    /**
     * Get all registered connections
     */
    public getConnections(): readonly DatabaseConnection[] {
        return this.connections;
    }

    /**
     * Get connection status
     */
    public getConnectionStatus(): Record<string, boolean> {
        const status: Record<string, boolean> = {};

        for (const connection of this.connections) {
            switch (connection.type) {
                case "postgres": {
                    status[connection.name] = (
                        connection.instance as DataSource
                    ).isInitialized;
                    break;
                }
                case "redis": {
                    status[connection.name] = (
                        connection.instance as RedisClientType
                    ).isOpen;
                    break;
                }
            }
        }

        return status;
    }

    /**
     * Initialize all database connections
     */
    public async initializeAll(): Promise<void> {
        if (this.initialized) {
            this.logger.warn("Database connections already initialized");
            return;
        }

        this.logger.info("Initializing all database connections...");

        const connectionPromises = this.connections.map((connection) =>
            this.initializeConnection(connection),
        );

        try {
            await Promise.all(connectionPromises);
            this.initialized = true;
            this.logger.info(
                "✅ All database connections established successfully",
            );
        } catch (error) {
            this.logger.error(
                "❌ Failed to initialize database connections:",
                error,
            );
            throw error;
        }
    }

    /**
     * Check if all connections are healthy
     */
    public isHealthy(): boolean {
        return this.connections.every((connection) => {
            switch (connection.type) {
                case "postgres":
                    return (connection.instance as DataSource).isInitialized;
                case "redis":
                    return (connection.instance as RedisClientType).isOpen;
                default:
                    return false;
            }
        });
    }

    /**
     * Close a single database connection
     */
    private async closeConnection(
        connection: DatabaseConnection,
    ): Promise<void> {
        try {
            switch (connection.type) {
                case "postgres": {
                    await this.closePostgres(
                        connection.instance as DataSource,
                        connection.name,
                    );
                    break;
                }
                case "redis": {
                    await this.closeRedis(
                        connection.instance as RedisClientType,
                        connection.name,
                    );
                    break;
                }
            }

            this.logger.info(
                `✅ ${connection.name} connection closed successfully`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Error closing ${connection.name} connection:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Close PostgreSQL connection
     */
    private async closePostgres(
        dataSource: DataSource,
        name: string,
    ): Promise<void> {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            this.logger.info(`${name} destroyed`);
        }
    }

    /**
     * Close Redis connection
     */
    private async closeRedis(
        client: RedisClientType,
        name: string,
    ): Promise<void> {
        if (client.isOpen) {
            await client.quit();
            this.logger.info(`${name} disconnected`);
        }
    }

    /**
     * Initialize a single database connection
     */
    private async initializeConnection(
        connection: DatabaseConnection,
    ): Promise<void> {
        this.logger.info(`Connecting to ${connection.name}...`);

        try {
            switch (connection.type) {
                case "postgres": {
                    await this.initializePostgres(
                        connection.instance as DataSource,
                        connection.name,
                    );
                    break;
                }
                case "redis": {
                    await this.initializeRedis(
                        connection.instance as RedisClientType,
                        connection.name,
                    );
                    break;
                }
            }

            this.logger.info(
                `✅ ${connection.name} connection established successfully`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Failed to initialize ${connection.name} connection:`,
                error,
            );
            throw error;
        }
    }

    /**
     * Initialize PostgreSQL connection
     */
    private async initializePostgres(
        dataSource: DataSource,
        name: string,
    ): Promise<void> {
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
            this.logger.info(`${name} initialized`);
        }

        // Test the connection
        await dataSource.query("SELECT 1");
        this.logger.info(`${name} connection test passed`);

        // Log entity metadata for debugging (only in development)
        if (this.config.NODE_ENV === "development") {
            const entities = dataSource.entityMetadatas;
            this.logger.info(
                `📊 ${name} loaded ${entities.length.toString()} entities: ${entities.map((e) => e.name).join(", ")}`,
            );
        }
    }

    /**
     * Initialize Redis connection
     */
    private async initializeRedis(
        client: RedisClientType,
        name: string,
    ): Promise<void> {
        if (!client.isOpen) {
            await client.connect();
            this.logger.info(`${name} connected`);
        }
    }

    /**
     * Register a database connection
     */
    private registerConnection(connection: DatabaseConnection): void {
        this.connections.push(connection);
        this.logger.debug(`Registered database connection: ${connection.name}`);
    }
}
