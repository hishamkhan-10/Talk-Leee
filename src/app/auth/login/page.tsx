"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, Loader2, KeyRound, ArrowLeft } from "lucide-react";

type Step = "email" | "otp";

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const emailInputRef = useRef<HTMLInputElement | null>(null);
    const otpInputRef = useRef<HTMLInputElement | null>(null);
    const errorId = useId();
    const messageId = useId();
    const otpHelpId = useId();

    useEffect(() => {
        const t = window.setTimeout(() => {
            if (step === "email") emailInputRef.current?.focus();
            if (step === "otp") otpInputRef.current?.focus();
        }, 0);
        return () => window.clearTimeout(t);
    }, [step]);

    // Handle email submission - sends OTP code
    async function handleEmailSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await api.login(email);
            const msg = typeof response === "string"
                ? response
                : response?.message || "Verification code sent! Check your email.";
            setMessage(msg);
            setStep("otp"); // Move to OTP input step
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else if (typeof err === "object" && err !== null) {
                setError((err as { detail?: string }).detail || "Login failed");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    // Handle OTP verification
    async function handleOtpSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await api.verifyOtp(email, otpCode);

            // Store the tokens
            api.setToken(response.access_token);
            if (typeof window !== "undefined") {
                localStorage.setItem("refresh_token", response.refresh_token);
            }

            // Redirect to dashboard
            router.push("/dashboard");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else if (typeof err === "object" && err !== null) {
                setError((err as { detail?: string }).detail || "Verification failed");
            } else {
                setError("Verification failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    // Go back to email step
    function handleBack() {
        setStep("email");
        setOtpCode("");
        setError("");
        setMessage("");
    }

    // Resend OTP code
    async function handleResend() {
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await api.login(email);
            const msg = typeof response === "string"
                ? response
                : response?.message || "New verification code sent!";
            setMessage(msg);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to resend code. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen bg-transparent flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 authHeroGradientBase" />
                <div className="absolute -inset-[30%] authHeroGradientBlobs" />
                <div className="absolute inset-0 authHeroGradientVignette" />
                <div className="absolute inset-0 authServicesGrid" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Talk-Lee
                        </h1>
                        <p className="text-sm text-[#D2B48C] dark:text-cyan-400 mt-1">AI Voice Dialer</p>
                    </Link>
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Welcome back</CardTitle>
                        <CardDescription>
                            {step === "email"
                                ? "Enter your email to receive a verification code"
                                : `Enter the verification code sent to ${email}`
                            }
                        </CardDescription>
                    </CardHeader>

                    {step === "email" ? (
                        // Step 1: Email input
                        <form onSubmit={handleEmailSubmit} aria-busy={loading} aria-describedby={error ? errorId : undefined}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                            disabled={loading}
                                            ref={emailInputRef}
                                            aria-invalid={error ? true : undefined}
                                            aria-describedby={error ? errorId : undefined}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div id={errorId} role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                        {error}
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                            Sending code...
                                        </>
                                    ) : (
                                        <>
                                            Send Verification Code
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                <p className="text-sm text-gray-500 text-center">
                                    New to Talk-Lee?{" "}
                                    <Link
                                        href="/auth/register"
                                        className="text-gray-900 font-medium hover:underline"
                                    >
                                        Create an account
                                    </Link>
                                </p>
                            </CardFooter>
                        </form>
                    ) : (
                        // Step 2: OTP input
                        <form
                            onSubmit={handleOtpSubmit}
                            aria-busy={loading}
                            aria-describedby={[message ? messageId : null, error ? errorId : null, otpHelpId].filter(Boolean).join(" ")}
                        >
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="otp">Verification Code</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="otp"
                                            type="text"
                                            placeholder="Enter verification code"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                                            className="pl-10 text-center text-lg tracking-widest font-mono"
                                            required
                                            disabled={loading}
                                            maxLength={8}
                                            autoComplete="one-time-code"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            ref={otpInputRef}
                                            aria-invalid={error ? true : undefined}
                                            aria-describedby={[message ? messageId : null, error ? errorId : null, otpHelpId].filter(Boolean).join(" ")}
                                        />
                                    </div>
                                    <p id={otpHelpId} className="text-xs text-muted-foreground text-center">
                                        Check your email for the verification code
                                    </p>
                                </div>

                                {error && (
                                    <div id={errorId} role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                        {error}
                                    </div>
                                )}

                                {message && (
                                    <div id={messageId} role="status" aria-live="polite" className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                                        {message}
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4">
                                <Button type="submit" className="w-full" disabled={loading || otpCode.length < 6}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Verify & Sign In
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                <div className="flex items-center justify-between w-full">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                                        disabled={loading}
                                    >
                                        <ArrowLeft className="h-3 w-3" />
                                        Change email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        className="text-sm text-foreground font-medium hover:underline"
                                        disabled={loading}
                                    >
                                        Resend code
                                    </button>
                                </div>
                            </CardFooter>
                        </form>
                    )}
                </Card>

                <p className="text-xs text-muted-foreground text-center mt-8">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>

            <style jsx>{`
                .authHeroGradientBase {
                    background: var(--home-gradient-base);
                    background-size: 200% 200%;
                    animation: authHeroGradientShift 14s ease-in-out infinite;
                    filter: saturate(1.1);
                }
                .authHeroGradientBlobs {
                    background: var(--home-gradient-blobs);
                    filter: blur(28px) saturate(1.15);
                    animation: authHeroBlobFloat 10s ease-in-out infinite;
                    transform: translate3d(0, 0, 0);
                    will-change: transform;
                }
                .authHeroGradientVignette {
                    background: var(--home-gradient-vignette);
                    pointer-events: none;
                }
                .authServicesGrid {
                    background-image: none;
                    opacity: 0;
                }
                :global(.dark) .authServicesGrid {
                    background-image:
                        linear-gradient(to right, rgba(21, 94, 117, 0.14) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(21, 94, 117, 0.12) 1px, transparent 1px);
                    background-size: 72px 72px;
                    opacity: 0.35;
                }
                @keyframes authHeroGradientShift {
                    0% {
                        background-position: 0% 40%;
                    }
                    50% {
                        background-position: 100% 60%;
                    }
                    100% {
                        background-position: 0% 40%;
                    }
                }
                @keyframes authHeroBlobFloat {
                    0% {
                        transform: translate3d(-2%, -1%, 0) scale(1);
                    }
                    33% {
                        transform: translate3d(2%, -3%, 0) scale(1.04);
                    }
                    66% {
                        transform: translate3d(-1%, 2%, 0) scale(1.02);
                    }
                    100% {
                        transform: translate3d(-2%, -1%, 0) scale(1);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .authHeroGradientBase,
                    .authHeroGradientBlobs {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
