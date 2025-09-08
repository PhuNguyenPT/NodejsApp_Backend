import "reflect-metadata";

import { registerEventListenerService } from "@/manager/event.listener.manager.js";

// A unique key to store metadata without conflicting with other libraries.
export const REDIS_EVENT_LISTENER_METADATA = Symbol(
    "redisEventListenerMetadata",
);

export interface RedisListenerMetadata {
    channel: string;
    methodName: string;
}

// Storage for service identifiers by constructor
const SERVICE_IDENTIFIER_METADATA = Symbol("serviceIdentifierMetadata");

/**
 * Class decorator to associate a service identifier with a class
 * This should be used on services that have @RedisEventListener methods
 *
 * Usage:
 * @EventListener(TYPES.MyService)
 * @injectable()
 * export class MyService { ... }
 */
export function EventListener(serviceIdentifier: symbol) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function <T extends new (...args: any[]) => any>(constructor: T): T {
        // Store the service identifier on the constructor
        Reflect.defineMetadata(
            SERVICE_IDENTIFIER_METADATA,
            serviceIdentifier,
            constructor,
        );

        // Register this service for event listener discovery
        registerEventListenerService(serviceIdentifier);

        return constructor;
    };
}

/**
 * Decorator that marks a method as a listener for a specific Redis channel.
 * @param channel The name of the Redis channel to subscribe to.
 */
export function RedisEventListener(channel: string) {
    return function (
        target: object,
        propertyKey: string,
        _descriptor: PropertyDescriptor,
    ) {
        const listeners =
            (Reflect.getMetadata(
                REDIS_EVENT_LISTENER_METADATA,
                target.constructor,
            ) as RedisListenerMetadata[] | undefined) ?? [];

        listeners.push({
            channel,
            methodName: propertyKey,
        });

        Reflect.defineMetadata(
            REDIS_EVENT_LISTENER_METADATA,
            listeners,
            target.constructor,
        );

        // Check if the service identifier is already registered
        const serviceIdentifier = Reflect.getMetadata(
            SERVICE_IDENTIFIER_METADATA,
            target.constructor,
        ) as symbol | undefined;

        if (!serviceIdentifier) {
            console.warn(
                `Warning: ${target.constructor.name} has @RedisEventListener methods but no @EventListener class decorator. ` +
                    `Please add @EventListener(TYPES.YourServiceType) to the class.`,
            );
        }
    };
}
