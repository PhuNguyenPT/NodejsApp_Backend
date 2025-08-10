// src/entity/jwt.token.ts
import { randomUUID } from "crypto";

export enum TokenType {
    ACCESS = "access",
    REFRESH = "refresh",
}

export class JwtEntity {
    public readonly createdAt: Date;
    public readonly id: string;
    public isBlacklisted: boolean;
    public modifiedAt?: Date;
    public readonly token: string;
    public ttl: number; // Time to live in seconds
    public readonly type: TokenType;

    /**
     * Single constructor that supports both use cases:
     * - Creating a new entity with token
     * - Rehydrating from stored data (id, createdAt, etc.)
     */
    constructor(params: {
        createdAt?: Date;
        id?: string;
        isBlacklisted?: boolean;
        modifiedAt?: Date;
        token: string;
        ttl?: number;
        type?: TokenType;
    }) {
        this.token = params.token;
        this.ttl = params.ttl ?? 3600;
        this.isBlacklisted = params.isBlacklisted ?? false;
        this.id = params.id ?? randomUUID();
        this.createdAt = params.createdAt ?? new Date();
        this.type = params.type ?? TokenType.ACCESS;
        this.modifiedAt = new Date();
    }

    // Create entity from Redis data
    static fromRedisObject(data: Record<string, string>): JwtEntity {
        return new JwtEntity({
            createdAt: new Date(data.createdAt),
            id: data.id,
            isBlacklisted: data.isBlacklisted === "true",
            modifiedAt: data.modifiedAt ? new Date(data.modifiedAt) : undefined,
            token: data.token,
            ttl: parseInt(data.ttl, 10),
            type: data.type ? (data.type as TokenType) : TokenType.ACCESS,
        });
    }

    // Blacklist the token
    blacklist(): void {
        this.isBlacklisted = true;
    }

    // Get remaining TTL in seconds
    getRemainingTtl(): number {
        if (this.isExpired()) {
            return 0;
        }
        const now = new Date();
        const expirationTime = new Date(
            this.createdAt.getTime() + this.ttl * 1000,
        );
        return Math.floor((expirationTime.getTime() - now.getTime()) / 1000);
    }

    // Check if token is expired based on TTL
    isExpired(): boolean {
        const now = new Date();
        const expirationTime = new Date(
            this.createdAt.getTime() + this.ttl * 1000,
        );
        return now > expirationTime;
    }

    // Check if token is valid (not blacklisted and not expired)
    isValid(): boolean {
        return !this.isBlacklisted && !this.isExpired();
    }

    // Convert entity to Redis-storable format
    toRedisObject(): Record<string, string> {
        return {
            createdAt: this.createdAt.toISOString(),
            id: this.id,
            isBlacklisted: this.isBlacklisted.toString(),
            token: this.token,
            ttl: this.ttl.toString(),
        };
    }
}
