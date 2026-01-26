// src/repository/jwt.token.repository.interface.ts
import type { JwtEntity } from "@/entity/security/jwt.entity.js";
import type { UUID } from "@/type/common/uuid.type.js";

export interface IJwtTokenRepository {
    blacklistToken(tokenId: UUID): Promise<boolean>;
    blacklistTokenByValue(token: string): Promise<boolean>;
    cleanup(): Promise<void>;
    deleteById(id: UUID): Promise<boolean>;
    deleteByToken(token: string): Promise<boolean>;
    deleteExpiredTokens(): Promise<number>;
    findById(id: UUID): Promise<JwtEntity | null>;
    findByToken(token: string): Promise<JwtEntity | null>;
    getAllTokens(): Promise<JwtEntity[]>;
    invalidateFamily(familyId: UUID): Promise<void>;
    isTokenBlacklisted(token: string): Promise<boolean>;
    save(jwtEntity: JwtEntity): Promise<void>;
}
