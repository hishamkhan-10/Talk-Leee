"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

interface MeResponse {
    id: string;
    email: string;
    name?: string;
    business_name?: string;
    role: string;
    minutes_remaining: number;
    partner_id?: string;
    tenant_id?: string;
    partner_status?: "active" | "suspended";
    tenant_status?: "active" | "suspended";
    suspension_reason?: string;
    suspended_at?: string;
    suspended_scope?: "partner" | "tenant";
}

interface AuthContextType {
    user: MeResponse | null;
    loading: boolean;
    login: (email: string) => Promise<string>;
    register: (email: string, businessName: string, name?: string) => Promise<string>;
    verifyOtp: (email: string, token: string) => Promise<{ access_token: string; refresh_token: string; user_id: string; email: string; message: string }>;
    logout: () => Promise<void>;
    setToken: (token: string) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<MeResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const me = await api.getMe();
                if (!active) return;
                setUser(me);
            } catch {
                if (!active) return;
                setUser(null);
            } finally {
                if (!active) return;
                setLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    async function login(email: string): Promise<string> {
        const res = await api.login(email);
        return res.message;
    }

    async function register(
        email: string,
        businessName: string,
        name?: string
    ): Promise<string> {
        const res = await api.register(email, businessName, "basic", name);
        return res.message;
    }

    async function verifyOtp(email: string, token: string) {
        const res = await api.verifyOtp(email, token);
        api.setToken(res.access_token);
        try {
            const me = await api.getMe();
            setUser(me);
        } catch {
            setUser(null);
        }
        return res;
    }

    async function logout() {
        await api.logout();
        try {
            localStorage.removeItem("refresh_token");
        } catch {}
        setUser(null);
    }

    function setToken(token: string) {
        api.setToken(token);
        void refreshUser();
    }

    async function refreshUser() {
        setLoading(true);
        try {
            const me = await api.getMe();
            setUser(me);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    const value = { user, loading, login, register, verifyOtp, logout, setToken, refreshUser };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
