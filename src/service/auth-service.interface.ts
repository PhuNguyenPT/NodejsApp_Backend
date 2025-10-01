import { LoginRequest, RegisterRequest } from "@/dto/auth/auth-request.js";
import { AuthResponse } from "@/dto/auth/auth-response.js";

export interface IAuthService {
    login(loginData: LoginRequest): Promise<AuthResponse>;
    logout(
        accessToken: string,
        refreshToken?: string,
    ): Promise<{ message: string; success: boolean }>;
    refreshToken(refreshToken: string): Promise<AuthResponse>;
    register(registerData: RegisterRequest): Promise<AuthResponse>;
}
