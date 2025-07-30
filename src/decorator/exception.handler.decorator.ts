// src/decorator/exception.handler.decorator.ts

import { ErrorDetails } from "@/type/interface/error.details";

// Use a more flexible constructor type that doesn't constrain parameters
type ErrorConstructor = abstract new (...args: never[]) => Error;

type ExceptionHandlerFn = (error: Error) => ErrorDetails;

// Use module pattern instead of namespace
const handlers = new Map<ErrorConstructor, ExceptionHandlerFn>();

export const ExceptionHandlerRegistry = {
    getAllHandlers(): Map<ErrorConstructor, ExceptionHandlerFn> {
        return new Map(handlers);
    },

    getHandler(error: Error): ExceptionHandlerFn | null {
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
