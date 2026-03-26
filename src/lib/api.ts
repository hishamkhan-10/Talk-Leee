import { z } from "zod";
import { getBrowserAuthToken, setBrowserAuthToken } from "@/lib/auth-token";
import { createHttpClient, ApiClientError } from "@/lib/http-client";
import { apiBaseUrl } from "@/lib/env";

function isDevAuthStubEnabled() {
    return process.env.NODE_ENV === "development";
}

function devMeForToken(token: string | null) {
    const t = token?.trim() ?? "";
    if (!t) {
        return { id: "user-guest", email: "guest@talk-lee.ai", name: "Guest", business_name: "Talk-Lee", role: "user", minutes_remaining: 0 };
    }
    if (t === "wl-admin-token") {
        return {
            id: "usr_wl_admin",
            email: "wl-admin@example.com",
            name: "White-label Admin",
            business_name: "Talk-Lee",
            role: "white_label_admin",
            minutes_remaining: 0,
        };
    }
    const partnerToken = t.match(/^partner-([a-z0-9-]+)-token$/i);
    if (partnerToken) {
        const partnerId = (partnerToken[1] ?? "").toLowerCase();
        return {
            id: `usr_partner_${partnerId}`,
            email: `partner-${partnerId}@example.com`,
            name: `Partner Admin (${partnerId.toUpperCase()})`,
            business_name: `Partner ${partnerId.toUpperCase()}`,
            role: "partner_admin",
            minutes_remaining: 0,
        };
    }
    if (t === "dev-token" || t === "e2e-token") {
        return {
            id: `usr_${t === "dev-token" ? "dev" : "e2e"}`,
            email: `${t === "dev-token" ? "dev" : "e2e"}@example.com`,
            name: t === "dev-token" ? "Dev User" : "E2E User",
            business_name: "Talk-Lee Demo Inc.",
            role: "admin",
            minutes_remaining: 1500,
        };
    }
    return {
        id: "user-001",
        email: "demo@talk-lee.ai",
        name: "Demo User",
        business_name: "Talk-Lee Demo Inc.",
        role: "admin",
        minutes_remaining: 1500,
    };
}

export const AuthResponseSchema = z
    .object({
        id: z.string().optional(),
        email: z.string().email().optional(),
        business_name: z.string().optional(),
        role: z.string().optional(),
        minutes_remaining: z.number().optional(),
        message: z.string().optional(),
    })
    .passthrough()
    .transform((v) => ({
        id: v.id ?? "",
        email: v.email ?? "",
        business_name: v.business_name,
        role: v.role ?? "",
        minutes_remaining: v.minutes_remaining ?? 0,
        message: v.message ?? "",
    }));

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const MeResponseSchema = z
    .object({
        id: z.string(),
        email: z.string().email(),
        name: z.string().optional().nullable(),
        business_name: z.string().optional().nullable(),
        role: z.string(),
        minutes_remaining: z.number(),
        partner_id: z.string().optional().nullable(),
        tenant_id: z.string().optional().nullable(),
    })
    .passthrough()
    .transform((v) => ({
        ...v,
        name: v.name ?? undefined,
        business_name: v.business_name ?? undefined,
        partner_id: v.partner_id ?? undefined,
        tenant_id: v.tenant_id ?? undefined,
    }));

export type MeResponse = z.infer<typeof MeResponseSchema>;

export const SessionListItemSchema = z
    .object({
        session_id: z.string(),
        session_handle: z.string(),
        ip_address: z.string().nullable().optional(),
        user_agent: z.string().nullable().optional(),
        created_at: z.string(),
        last_activity_at: z.string(),
        current: z.boolean().optional(),
    })
    .passthrough()
    .transform((v) => ({
        session_id: v.session_id,
        session_handle: v.session_handle,
        ip_address: v.ip_address ?? null,
        user_agent: v.user_agent ?? null,
        created_at: v.created_at,
        last_activity_at: v.last_activity_at,
        current: v.current ?? false,
    }));

export const SessionListResponseSchema = z
    .object({ items: z.array(SessionListItemSchema) })
    .passthrough()
    .transform((v) => ({ items: v.items }));

export type SessionListResponse = z.infer<typeof SessionListResponseSchema>;

export const VerifyOtpResponseSchema = z
    .object({
        access_token: z.string(),
        refresh_token: z.string(),
        user_id: z.string(),
        email: z.string().email(),
        message: z.string().optional(),
    })
    .passthrough()
    .transform((v) => ({ ...v, message: v.message ?? "" }));

export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;

class ApiClient {
    private _client: ReturnType<typeof createHttpClient> | undefined;

    private client() {
        if (this._client) return this._client;
        this._client = createHttpClient({ baseUrl: apiBaseUrl(), getToken: () => null, setToken: () => {} });
        return this._client;
    }

    private parseOrThrow<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }, data: unknown, meta: { url: string; method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" }) {
        const parsed = schema.safeParse(data);
        if (parsed.success) return parsed.data;
        throw new ApiClientError({ code: "invalid_response", message: "Invalid response format", url: meta.url, method: meta.method, details: data });
    }

    setToken(token: string) {
        setBrowserAuthToken(token);
    }

    clearToken() {
        setBrowserAuthToken(null);
    }

    async login(email: string): Promise<AuthResponse> {
        if (isDevAuthStubEnabled()) {
            return AuthResponseSchema.parse({
                email,
                message: "Development mode: login bypassed",
            });
        }
        const path = "/auth/login";
        const method = "POST" as const;
        const data = await this.client().request({
            path,
            method,
            body: { email },
            timeoutMs: 12_000,
        });
        return this.parseOrThrow(AuthResponseSchema, data, { url: `${apiBaseUrl()}${path}`, method });
    }

    async verifyOtp(email: string, token: string): Promise<VerifyOtpResponse> {
        if (isDevAuthStubEnabled()) {
            return VerifyOtpResponseSchema.parse({
                access_token: "dev-token",
                refresh_token: "dev-refresh-token",
                user_id: "user-001",
                email,
                message: "Development mode: OTP verified",
            });
        }
        const path = "/auth/verify-otp";
        const method = "POST" as const;
        const data = await this.client().request({
            path,
            method,
            body: { email, token },
            timeoutMs: 12_000,
        });
        return this.parseOrThrow(VerifyOtpResponseSchema, data, { url: `${apiBaseUrl()}${path}`, method });
    }

    async register(
        email: string,
        businessName: string,
        planId: string = "basic",
        name?: string
    ): Promise<AuthResponse> {
        if (isDevAuthStubEnabled()) {
            return AuthResponseSchema.parse({
                id: "user-001",
                email,
                business_name: businessName,
                role: "admin",
                minutes_remaining: 1500,
                message: "Development mode: registration bypassed",
            });
        }
        const path = "/auth/register";
        const method = "POST" as const;
        const data = await this.client().request({
            path,
            method,
            body: { email, business_name: businessName, plan_id: planId, ...(name ? { name } : {}) },
            timeoutMs: 12_000,
        });
        return this.parseOrThrow(AuthResponseSchema, data, { url: `${apiBaseUrl()}${path}`, method });
    }

    async getMe(): Promise<MeResponse> {
        if (isDevAuthStubEnabled()) {
            return MeResponseSchema.parse(devMeForToken(getBrowserAuthToken()));
        }
        const method = "GET" as const;
        try {
            const path = "/auth/me";
            const data = await this.client().request({ path, method, timeoutMs: 12_000 });
            return this.parseOrThrow(MeResponseSchema, data, { url: `${apiBaseUrl()}${path}`, method });
        } catch (err) {
            if (err instanceof ApiClientError && err.status === 404) {
                const path = "/me";
                const data = await this.client().request({ path, method, timeoutMs: 12_000 });
                return this.parseOrThrow(MeResponseSchema, data, { url: `${apiBaseUrl()}${path}`, method });
            }
            throw err;
        }
    }

    async logout(): Promise<void> {
        try {
            await this.client().request({ path: "/auth/logout", method: "POST", timeoutMs: 12_000 });
        } catch (err) {
            if (err instanceof ApiClientError && (err.status === 404 || err.status === 405)) {
            } else {
                throw err;
            }
        } finally {
            this.clearToken();
        }
    }

    async logoutAllSessions(): Promise<void> {
        try {
            await this.client().request({ path: "/auth/logout_all", method: "POST", timeoutMs: 12_000 });
        } catch (err) {
            if (err instanceof ApiClientError && (err.status === 404 || err.status === 405)) {
            } else {
                throw err;
            }
        } finally {
            this.clearToken();
        }
    }

    async listSessions(): Promise<SessionListResponse> {
        const path = "/auth/sessions";
        const method = "GET" as const;
        const data = await this.client().request({ path, method, timeoutMs: 12_000 });
        return this.parseOrThrow(SessionListResponseSchema, data, { url: `${apiBaseUrl()}${path}`, method });
    }

    async revokeSession(sessionHandle: string): Promise<void> {
        const handle = sessionHandle.trim();
        if (!handle) return;
        try {
            await this.client().request({
                path: "/auth/sessions/revoke",
                method: "POST",
                body: { session_handle: handle },
                timeoutMs: 12_000,
            });
        } catch (err) {
            if (err instanceof ApiClientError && err.status === 404) return;
            throw err;
        }
    }

    async health(): Promise<{ status: string }> {
        const path = "/health";
        return this.client().request({ path, method: "GET", timeoutMs: 2500 });
    }
}

export const api = new ApiClient();
