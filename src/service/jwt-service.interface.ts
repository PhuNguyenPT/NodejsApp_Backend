import { CustomJwtPayload } from "@/type/interface/jwt.interface.js";

export interface IJWTService {
    decodeToken(token: string): CustomJwtPayload | null;
    generateAccessToken(
        payload: CustomJwtPayload,
        familyId: string,
    ): Promise<string>;
    generateRefreshToken(
        payload: CustomJwtPayload,
        familyId: string,
    ): Promise<string>;
    verifyToken(token: string): Promise<CustomJwtPayload>;
}
