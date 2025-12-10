import type { LoginRequest, RegisterRequest } from "@/dto/auth/auth-request.js";
import type { AuthResponse } from "@/dto/auth/auth-response.js";

export interface IAuthService {
    login(loginRequest: LoginRequest): Promise<AuthResponse>;
    logout(
        accessToken: string,
        refreshToken?: string,
    ): Promise<{ message: string; success: boolean }>;
    refreshToken(refreshToken: string): Promise<AuthResponse>;
    register(registerRequest: RegisterRequest): Promise<AuthResponse>;
}
