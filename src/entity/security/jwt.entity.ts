import { v7 as uuidv7 } from "uuid";

// src/entity/jwt.entity.ts
import { JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS } from "@/config/jwt.config.js";
import { type UUID, UUIDSchema } from "@/type/common/uuid.type.js";

export enum TokenType {
    ACCESS = "access",
    REFRESH = "refresh",
}

export class JwtEntity {
    public readonly createdAt: Date;
    public readonly familyId: UUID;
    public readonly id: UUID;
    public isBlacklisted: boolean;
    public readonly token: string;
    public ttl: number; // Time to live in seconds
    public readonly type: TokenType;
    public updatedAt?: Date;

    /**
     * Single constructor that supports both use cases:
     * - Creating a new entity with token
     * - Rehydrating from stored data (id, createdAt, etc.)
     */
    constructor(params: {
        createdAt?: Date;
        familyId?: UUID;
        id?: UUID;
        isBlacklisted?: boolean;
        token: string;
        ttl?: number;
        type: TokenType;
        updatedAt?: Date;
    }) {
        this.token = params.token;
        this.ttl = params.ttl ?? JWT_ACCESS_TOKEN_EXPIRATION_IN_SECONDS;
        this.isBlacklisted = params.isBlacklisted ?? false;

        const uuid = params.id ?? UUIDSchema.parse(uuidv7());
        this.id = uuid;

        this.createdAt =
            params.createdAt ?? this.extractTimestampFromUuidV7(uuid);

        this.type = params.type;
        this.updatedAt = params.updatedAt;
        this.familyId = params.familyId ?? UUIDSchema.parse(uuidv7());
    }

    // Create entity from Redis data
    static fromRedisObject(data: Record<string, string>): JwtEntity {
        return new JwtEntity({
            createdAt: new Date(data.createdAt),
            familyId: UUIDSchema.parse(data.familyId),
            id: UUIDSchema.parse(data.id),
            isBlacklisted: data.isBlacklisted === "true",
            token: data.token,
            ttl: parseInt(data.ttl, 10),
            type: data.type ? (data.type as TokenType) : TokenType.ACCESS,
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
        });
    }

    // Blacklist the token
    blacklist(): void {
        this.isBlacklisted = true;
        this.updatedAt = new Date();
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
        return now >= expirationTime;
    }

    // Check if token is valid (not blacklisted and not expired)
    isValid(): boolean {
        return !this.isBlacklisted && !this.isExpired();
    }

    // Convert entity to Redis-storable format
    toRedisObject(): Record<string, string> {
        const obj: Record<string, string> = {
            createdAt: this.createdAt.toISOString(),
            familyId: this.familyId,
            id: this.id,
            isBlacklisted: this.isBlacklisted.toString(),
            token: this.token,
            ttl: this.ttl.toString(),
            type: this.type,
        };

        if (this.updatedAt) {
            obj.updatedAt = this.updatedAt.toISOString();
        }

        return obj;
    }

    /**
     * Extract timestamp from UUIDv7
     * UUIDv7 format: tttttttt-tttt-7xxx-xxxx-xxxxxxxxxxxx
     * where 't' represents timestamp bits (48 bits total = 12 hex characters)
     *
     * The first 48 bits contain a Unix timestamp in milliseconds
     *
     * @param uuid - The UUIDv7 string
     * @returns Date object extracted from the UUID timestamp
     */
    private extractTimestampFromUuidV7(uuid: UUID): Date {
        // Remove hyphens and get first 12 hex characters (48 bits)
        const hex = uuid.replace(/-/g, "").substring(0, 12);

        // Convert hex to decimal to get milliseconds since Unix epoch
        const timestamp = parseInt(hex, 16);

        return new Date(timestamp);
    }
}
