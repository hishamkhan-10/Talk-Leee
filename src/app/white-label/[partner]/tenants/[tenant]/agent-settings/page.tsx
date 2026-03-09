"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useWhiteLabelBranding } from "@/components/white-label/white-label-branding-provider";

type AgentSettings = {
    systemPrompt: string;
    greetingMessage: string;
    transferEnabled: boolean;
};

type AgentSettingsResponse = {
    partner: { id: string; allowTransfer: boolean };
    tenant: { id: string };
    config: AgentSettings;
    updatedAt?: string;
};

function normalizeParam(value: string | string[] | undefined) {
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
}

function endpointUrl(partnerId: string, tenantId: string) {
    return `/api/v1/white-label/partners/${encodeURIComponent(partnerId)}/tenants/${encodeURIComponent(tenantId)}/agent-settings`;
}

export default function WhiteLabelTenantAgentSettingsPage() {
    const params = useParams();
    const partnerId = normalizeParam(params?.partner as string | string[] | undefined);
    const tenantId = normalizeParam(params?.tenant as string | string[] | undefined);
    const branding = useWhiteLabelBranding()?.branding;

    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [allowTransfer, setAllowTransfer] = useState(false);

    const [systemPrompt, setSystemPrompt] = useState("");
    const [greetingMessage, setGreetingMessage] = useState("");
    const [transferEnabled, setTransferEnabled] = useState(false);

    const [baseline, setBaseline] = useState<AgentSettings | null>(null);
    const [inlineError, setInlineError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const trimmedPrompt = systemPrompt.trim();
    const trimmedGreeting = greetingMessage.trim();

    const fieldErrors = useMemo(() => {
        return {
            systemPrompt: loaded && trimmedPrompt.length === 0 ? "System prompt is required." : "",
            greetingMessage: loaded && trimmedGreeting.length === 0 ? "Greeting message is required." : "",
        };
    }, [loaded, trimmedGreeting.length, trimmedPrompt.length]);

    const dirty = useMemo(() => {
        if (!baseline) return false;
        return (
            baseline.systemPrompt !== systemPrompt ||
            baseline.greetingMessage !== greetingMessage ||
            baseline.transferEnabled !== transferEnabled
        );
    }, [baseline, greetingMessage, systemPrompt, transferEnabled]);

    const canSave = useMemo(() => {
        if (!loaded) return false;
        if (saving) return false;
        if (trimmedPrompt.length === 0) return false;
        if (trimmedGreeting.length === 0) return false;
        if (transferEnabled && !allowTransfer) return false;
        return dirty;
    }, [allowTransfer, dirty, loaded, saving, transferEnabled, trimmedGreeting.length, trimmedPrompt.length]);

    useEffect(() => {
        if (!partnerId || !tenantId) return;
        let cancelled = false;
        setLoading(true);
        setInlineError(null);
        setSuccess(null);

        fetch(endpointUrl(partnerId, tenantId), { method: "GET", headers: { "content-type": "application/json" }, cache: "no-store" })
            .then(async (res) => {
                const data = (await res.json()) as AgentSettingsResponse | { detail?: string; error?: string };
                if (!res.ok) {
                    const msg = typeof (data as { detail?: string }).detail === "string" ? (data as { detail: string }).detail : "Failed to load agent settings.";
                    throw new Error(msg);
                }
                return data as AgentSettingsResponse;
            })
            .then((data) => {
                if (cancelled) return;
                setAllowTransfer(Boolean(data.partner.allowTransfer));
                setSystemPrompt(data.config.systemPrompt ?? "");
                setGreetingMessage(data.config.greetingMessage ?? "");
                setTransferEnabled(Boolean(data.config.transferEnabled) && Boolean(data.partner.allowTransfer));
                setBaseline({
                    systemPrompt: data.config.systemPrompt ?? "",
                    greetingMessage: data.config.greetingMessage ?? "",
                    transferEnabled: Boolean(data.config.transferEnabled) && Boolean(data.partner.allowTransfer),
                });
                setLoaded(true);
            })
            .catch((err) => {
                if (cancelled) return;
                setInlineError(err instanceof Error ? err.message : "Failed to load agent settings.");
                setLoaded(true);
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [partnerId, tenantId]);

    useEffect(() => {
        if (!allowTransfer && transferEnabled) setTransferEnabled(false);
    }, [allowTransfer, transferEnabled]);

    const save = async () => {
        setInlineError(null);
        setSuccess(null);

        const prompt = systemPrompt.trim();
        const greeting = greetingMessage.trim();
        if (prompt.length === 0) {
            setInlineError("System prompt cannot be empty.");
            return;
        }
        if (greeting.length === 0) {
            setInlineError("Greeting message cannot be empty.");
            return;
        }
        if (transferEnabled && !allowTransfer) {
            setInlineError("Call transfer is disabled by partner policy.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(endpointUrl(partnerId, tenantId), {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ systemPrompt: prompt, greetingMessage: greeting, transferEnabled: Boolean(transferEnabled) }),
            });
            const data = (await res.json()) as AgentSettingsResponse | { detail?: string };
            if (!res.ok) {
                const msg = typeof (data as { detail?: string }).detail === "string" ? (data as { detail: string }).detail : "Failed to save changes.";
                throw new Error(msg);
            }
            const out = data as AgentSettingsResponse;
            setAllowTransfer(Boolean(out.partner.allowTransfer));
            setSystemPrompt(out.config.systemPrompt ?? "");
            setGreetingMessage(out.config.greetingMessage ?? "");
            setTransferEnabled(Boolean(out.config.transferEnabled) && Boolean(out.partner.allowTransfer));
            setBaseline({
                systemPrompt: out.config.systemPrompt ?? "",
                greetingMessage: out.config.greetingMessage ?? "",
                transferEnabled: Boolean(out.config.transferEnabled) && Boolean(out.partner.allowTransfer),
            });
            setSuccess("Saved changes.");
        } catch (err) {
            setInlineError(err instanceof Error ? err.message : "Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const title = branding ? `${branding.displayName} Agent Settings` : "Agent Settings";

    return (
        <DashboardLayout
            title={title}
            description={tenantId ? `Configure conversational behavior for tenant "${tenantId}".` : "Configure conversational behavior for this tenant."}
        >
            <div className="space-y-6">
                {inlineError ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
                        {inlineError}
                    </div>
                ) : null}
                {success ? (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100" role="status">
                        {success}
                    </div>
                ) : null}

                <div className="content-card space-y-3">
                    <div className="text-sm font-semibold text-foreground">System Prompt</div>
                    <div className="text-sm text-muted-foreground">
                        Define the agent&apos;s behavior, tone, and instructions. This stays scoped to the selected tenant.
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="systemPrompt">Prompt</Label>
                        <textarea
                            id="systemPrompt"
                            value={systemPrompt}
                            onChange={(e) => {
                                setSystemPrompt(e.target.value);
                                setInlineError(null);
                                setSuccess(null);
                            }}
                            rows={10}
                            className={cn(
                                "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:bg-accent/20 hover:border-foreground/20 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                fieldErrors.systemPrompt ? "border-red-500/50 focus-visible:ring-red-500/30" : ""
                            )}
                            disabled={loading || saving}
                            placeholder="You are a friendly salon receptionist. Greet callers politely and assist with booking appointments."
                        />
                        {fieldErrors.systemPrompt ? <div className="text-xs text-red-200">{fieldErrors.systemPrompt}</div> : null}
                    </div>
                </div>

                <div className="content-card space-y-3">
                    <div className="text-sm font-semibold text-foreground">Greeting Message</div>
                    <div className="text-sm text-muted-foreground">Spoken at the beginning of every call for this tenant.</div>
                    <div className="space-y-2">
                        <Label htmlFor="greetingMessage">Greeting</Label>
                        <Input
                            id="greetingMessage"
                            value={greetingMessage}
                            onChange={(e) => {
                                setGreetingMessage(e.target.value);
                                setInlineError(null);
                                setSuccess(null);
                            }}
                            disabled={loading || saving}
                            className={fieldErrors.greetingMessage ? "border-red-500/50 focus-visible:ring-red-500/30" : undefined}
                            placeholder="Hello! Thank you for calling. How may I assist you today?"
                        />
                        {fieldErrors.greetingMessage ? <div className="text-xs text-red-200">{fieldErrors.greetingMessage}</div> : null}
                    </div>
                </div>

                <div className="content-card space-y-3">
                    <div className="text-sm font-semibold text-foreground">Call Transfer</div>
                    <div className="text-sm text-muted-foreground">
                        Allow the agent to transfer callers to a human when needed.
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground">Enable Call Transfer</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                {allowTransfer ? "Toggle ON to permit transfer." : "Disabled by partner policy."}
                            </div>
                        </div>
                        <Switch
                            checked={transferEnabled}
                            onCheckedChange={(next) => {
                                setTransferEnabled(next);
                                setInlineError(null);
                                setSuccess(null);
                            }}
                            ariaLabel="Enable call transfer"
                            disabled={!allowTransfer || loading || saving}
                        />
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                            if (!baseline) return;
                            setSystemPrompt(baseline.systemPrompt);
                            setGreetingMessage(baseline.greetingMessage);
                            setTransferEnabled(baseline.transferEnabled);
                            setInlineError(null);
                            setSuccess(null);
                        }}
                        disabled={!dirty || saving || loading}
                    >
                        Reset
                    </Button>
                    <Button type="button" onClick={save} disabled={!canSave}>
                        {saving ? "Saving…" : "Save Changes"}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}

