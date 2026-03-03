"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import { getBrowserAuthToken } from "@/lib/auth-token";

interface MeResponse {
    id: string;
    email: string;
    name?: string;
    business_name?: string;
    role: string;
    minutes_remaining: number;
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
        const token = getBrowserAuthToken();
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        api.setToken(token);
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
            const token = getBrowserAuthToken();
            if (!token) {
                setUser(null);
                return;
            }
            api.setToken(token);
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
