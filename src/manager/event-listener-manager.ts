import { Container, inject, injectable } from "inversify";
import { type RedisClientType } from "redis";

import {
    REDIS_EVENT_LISTENER_METADATA,
    RedisListenerMetadata,
} from "@/decorator/redis-event-listener.decorator.js";
import { TYPES } from "@/type/container/types.js";
import { ILogger } from "@/type/interface/logger.interface.js";

// Type for Redis message handler
type RedisMessageHandler = (message: string) => Promise<void> | void;

// Global registry to store service identifiers that have Redis event listeners
const REDIS_EVENT_LISTENER_SERVICES = new Set<symbol>();

/**
 * Get all registered service identifiers that have Redis event listeners
 */
export function getEventListenerServices(): symbol[] {
    return Array.from(REDIS_EVENT_LISTENER_SERVICES);
}

/**
 * Register a service identifier that has Redis event listeners
 * This is called automatically by the enhanced decorator
 */
export function registerEventListenerService(serviceIdentifier: symbol): void {
    REDIS_EVENT_LISTENER_SERVICES.add(serviceIdentifier);
}

// Type guard to check if a value is a function
function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
    return typeof value === "function";
}

// Type guard to check if a value is a valid object instance
function isObjectInstance(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

@injectable()
export class EventListenerManager {
    private readonly subscriptions = new Map<string, RedisMessageHandler>();

    constructor(
        @inject(TYPES.InversifyContainer)
        private readonly container: Container,
        @inject(TYPES.RedisSubscriber)
        private readonly redisSubscriber: RedisClientType,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    public async cleanup(): Promise<void> {
        this.logger.info("Cleaning up event listeners...");
        for (const [key, handler] of this.subscriptions.entries()) {
            const channel = key.split(":")[0] ?? "";
            try {
                await this.redisSubscriber.unsubscribe(channel, handler);
                this.logger.info(`Unsubscribed from channel: ${channel}`);
            } catch (error) {
                this.logger.error(`Error unsubscribing from ${channel}`, {
                    error,
                });
            }
        }
        this.subscriptions.clear();
        this.logger.info("✅ Event listeners cleaned up.");
    }

    /**
     * Initialize event listeners by automatically discovering all services
     * that have been decorated with @RedisEventListener
     */
    public async initialize(): Promise<void> {
        this.logger.info("Initializing event listeners...");

        const serviceIdentifiers = getEventListenerServices();

        if (serviceIdentifiers.length === 0) {
            this.logger.info("No Redis event listener services found.");
            return;
        }

        this.logger.info(
            `Found ${serviceIdentifiers.length.toString()} service(s) with Redis event listeners`,
        );

        for (const identifier of serviceIdentifiers) {
            try {
                // Check if the service is bound before trying to get it
                if (!this.container.isBound(identifier)) {
                    this.logger.warn(
                        `Service ${identifier.toString()} is not bound in container, skipping.`,
                    );
                    continue;
                }

                const serviceInstance = this.container.get<unknown>(identifier);

                // Type guard to ensure the instance is a usable object
                if (!isObjectInstance(serviceInstance)) {
                    this.logger.warn(
                        `Service instance for ${identifier.toString()} is not an object, skipping.`,
                    );
                    continue;
                }

                const listeners = Reflect.getMetadata(
                    REDIS_EVENT_LISTENER_METADATA,
                    serviceInstance.constructor,
                ) as RedisListenerMetadata[] | undefined;

                if (listeners?.length) {
                    this.logger.info(
                        `Found ${listeners.length.toString()} listener(s) in ${
                            serviceInstance.constructor.name
                        }`,
                    );

                    for (const listener of listeners) {
                        await this.registerListener(serviceInstance, listener);
                    }
                } else {
                    this.logger.warn(
                        `Service ${serviceInstance.constructor.name} is registered but has no Redis event listeners metadata`,
                    );
                }
            } catch (error) {
                this.logger.error(
                    `Error processing service ${identifier.toString()}`,
                    { error },
                );
                // Continue with other services instead of throwing
            }
        }
        this.logger.info("✅ All event listeners initialized successfully.");
    }

    private async registerListener(
        instance: Record<string, unknown>,
        metadata: RedisListenerMetadata,
    ): Promise<void> {
        const { channel, methodName } = metadata;

        const method = instance[methodName];

        // Use type guard to check if method is a function
        if (!isFunction(method)) {
            this.logger.warn(
                `Property '${methodName}' on '${instance.constructor.name}' is not a function. Skipping listener.`,
            );
            return;
        }

        // Create a properly typed handler function
        const handler: RedisMessageHandler = (message: string) => {
            try {
                // Call the method with proper context and type safety
                const result: unknown = method.call(instance, message);

                // Handle both sync and async methods
                if (result instanceof Promise) {
                    result.catch((error: unknown) => {
                        this.logger.error(
                            `Error in async event handler '${methodName}' for channel '${channel}'`,
                            { error },
                        );
                    });
                }
            } catch (error: unknown) {
                this.logger.error(
                    `Error in sync event handler '${methodName}' for channel '${channel}'`,
                    { error },
                );
            }
        };

        this.subscriptions.set(`${channel}:${methodName}`, handler);

        try {
            await this.redisSubscriber.subscribe(channel, handler);
            this.logger.info(
                `   -> Method '${methodName}' successfully subscribed to channel '${channel}'`,
            );
        } catch (error) {
            this.logger.error(
                `   -> Failed to subscribe '${methodName}' to channel '${channel}'`,
                { error },
            );
            throw error;
        }
    }
}
