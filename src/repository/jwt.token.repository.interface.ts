// src/repository/jwt.token.repository.interface.ts
import { JwtEntity } from "@/entity/jwt.entity.js";

export interface IJwtTokenRepository {
    blacklistToken(tokenId: string): Promise<boolean>;
    blacklistTokenByValue(token: string): Promise<boolean>;
    cleanup(): Promise<void>;
    deleteById(id: string): Promise<boolean>;
    deleteByToken(token: string): Promise<boolean>;
    deleteExpiredTokens(): Promise<number>;
    findById(id: string): Promise<JwtEntity | null>;
    findByToken(token: string): Promise<JwtEntity | null>;
    getAllTokens(): Promise<JwtEntity[]>;
    isTokenBlacklisted(token: string): Promise<boolean>;
    save(jwtEntity: JwtEntity): Promise<void>;
}
