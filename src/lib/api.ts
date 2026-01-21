// PROTOTYPE MODE - All APIs return dummy data

import { setBrowserAuthToken } from "@/lib/auth-token";

export interface AuthResponse {
    id: string;
    email: string;
    business_name?: string;
    role: string;
    minutes_remaining: number;
    message: string;
}

export interface MeResponse {
    id: string;
    email: string;
    name?: string;
    business_name?: string;
    role: string;
    minutes_remaining: number;
}

export interface ApiError {
    detail: string;
}

export interface VerifyOtpResponse {
    access_token: string;
    refresh_token: string;
    user_id: string;
    email: string;
    message: string;
}

// Dummy user data
const DUMMY_USER: MeResponse = {
    id: "user-001",
    email: "demo@talk-lee.ai",
    name: "Demo User",
    business_name: "Talk-Lee Demo Inc.",
    role: "admin",
    minutes_remaining: 1500,
};

class ApiClient {
    setToken(token: string) {
        setBrowserAuthToken(token);
    }

    clearToken() {
        setBrowserAuthToken(null);
    }

    // Auth endpoints - all return dummy data
    async login(_email: string): Promise<AuthResponse> {
        void _email;
        return {
            id: DUMMY_USER.id,
            email: DUMMY_USER.email,
            business_name: DUMMY_USER.business_name,
            role: DUMMY_USER.role,
            minutes_remaining: DUMMY_USER.minutes_remaining,
            message: "Verification code sent! (Prototype mode)",
        };
    }

    async verifyOtp(_email: string, _token: string): Promise<VerifyOtpResponse> {
        void _email;
        void _token;
        return {
            access_token: "dummy-access-token",
            refresh_token: "dummy-refresh-token",
            user_id: DUMMY_USER.id,
            email: DUMMY_USER.email,
            message: "OTP verified successfully! (Prototype mode)",
        };
    }

    async register(
        _email: string,
        _businessName: string,
        _planId: string = "basic",
        _name?: string
    ): Promise<AuthResponse> {
        void _email;
        void _businessName;
        void _planId;
        void _name;
        return {
            id: DUMMY_USER.id,
            email: DUMMY_USER.email,
            business_name: DUMMY_USER.business_name,
            role: DUMMY_USER.role,
            minutes_remaining: DUMMY_USER.minutes_remaining,
            message: "Registration successful! (Prototype mode)",
        };
    }

    async getMe(): Promise<MeResponse> {
        return DUMMY_USER;
    }

    async logout(): Promise<void> {
        this.clearToken();
    }

    // Health check
    async health(): Promise<{ status: string }> {
        return { status: "ok" };
    }
}

export const api = new ApiClient();
