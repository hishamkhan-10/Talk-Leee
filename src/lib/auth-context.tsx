"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import { getBrowserAuthToken, setBrowserAuthToken } from "@/lib/auth-token";

// Prototype user profile used while backend auth endpoints are not wired.
const DUMMY_USER = {
    id: "user-001",
    email: "demo@talk-lee.ai",
    name: "Demo User",
    business_name: "Talk-Lee Demo Inc.",
    role: "admin",
    minutes_remaining: 1500,
};

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
        const token = getBrowserAuthToken();
        setUser(token ? DUMMY_USER : null);
        setLoading(false);
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
        setUser(DUMMY_USER);
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
        setUser(DUMMY_USER);
    }

    async function refreshUser() {
        setLoading(true);
        try {
            const token = getBrowserAuthToken();
            setUser(token ? DUMMY_USER : null);
        } finally {
            setLoading(false);
        }
    }

    const value = useMemo(
        () => ({ user, loading, login, register, verifyOtp, logout, setToken, refreshUser }),
        [loading, user]
    );

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
