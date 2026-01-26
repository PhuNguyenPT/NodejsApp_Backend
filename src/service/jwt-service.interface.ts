import type { UUID } from "@/type/common/uuid.type.js";
import type { CustomJwtPayload } from "@/type/interface/jwt.interface.js";

export interface IJwtService {
    decodeToken(token: string): CustomJwtPayload | null;
    generateAccessToken(
        payload: CustomJwtPayload,
        familyId: UUID,
    ): Promise<string>;
    generateRefreshToken(
        payload: CustomJwtPayload,
        familyId: UUID,
    ): Promise<string>;
    verifyToken(token: string): Promise<CustomJwtPayload>;
}
