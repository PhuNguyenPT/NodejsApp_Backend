// src/decorator/exception.handler.decorator.ts

import { ErrorDetails } from "@/type/interface/error-details.interface.js";

// Make it more flexible to accept any class constructor, not just Error subclasses
type ErrorConstructor = abstract new (...args: never[]) => unknown;

type ExceptionHandlerFn = (error: unknown) => ErrorDetails;

// Use module pattern instead of namespace
const handlers = new Map<ErrorConstructor, ExceptionHandlerFn>();

export const ExceptionHandlerRegistry = {
    getAllHandlers(): Map<ErrorConstructor, ExceptionHandlerFn> {
        return new Map(handlers);
    },

    getHandler(error: unknown): ExceptionHandlerFn | null {
        if (!error || typeof error !== "object") {
            return null;
        }

        // Check for exact match first
        for (const [ExceptionClass, handler] of handlers.entries()) {
            if (error.constructor === ExceptionClass) {
                return handler;
            }
        }
        // Then check for instanceof matches (inheritance)
        for (const [ExceptionClass, handler] of handlers.entries()) {
            if (error instanceof ExceptionClass) {
                return handler;
            }
        }
        return null;
    },

    register(
        exceptionType: ErrorConstructor,
        handler: ExceptionHandlerFn,
    ): void {
        handlers.set(exceptionType, handler);
    },
};

export function ExceptionHandler(exceptionType: ErrorConstructor) {
    return function (
        target: object,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
    ): void {
        const handler = descriptor.value as ExceptionHandlerFn;
        ExceptionHandlerRegistry.register(exceptionType, handler);
    };
}
