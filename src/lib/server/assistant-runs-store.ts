 import { captureException } from "@/lib/monitoring";

export type StoredAssistantRun = {
    id: string;
    owner_token: string;
    action_type: string;
    source: string;
    lead_id?: string | null;
    status: "pending" | "in_progress" | "completed" | "failed";
    created_at: string;
    started_at?: string | null;
    completed_at?: string | null;
    result?: string | null;
    request_payload?: unknown;
    response_payload?: unknown;
    error?: unknown;
};

export type AssistantRunApi = Omit<StoredAssistantRun, "owner_token">;

export type AssistantActionApi = {
    id: string;
    name: string;
    description: string;
    parameters: Record<string, unknown>;
};

type Store = {
    runsById: Map<string, StoredAssistantRun>;
};

function getStore(): Store {
    const key = "__talklee_assistant_runs_store__";
    const g = globalThis as unknown as { [k: string]: Store | undefined };
    if (!g[key]) g[key] = { runsById: new Map() };
    return g[key]!;
}

function randomId(prefix: string) {
    try {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
    } catch {}
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

const ACTIONS: AssistantActionApi[] = [
    {
        id: "email:send_followup",
        name: "Send follow-up email",
        description: "Send a follow-up email to a lead, using provided context fields.",
        parameters: {
            required: ["lead_id"],
            optional: ["subject", "body", "template_id"],
            safeDefaults: { subject: "Following up", body: "Hi there — just checking in." },
        },
    },
    {
        id: "crm:update_lead_status",
        name: "Update lead status",
        description: "Update CRM status for a lead.",
        parameters: {
            required: ["lead_id", "status"],
            allowedStatus: ["new", "contacted", "qualified", "won", "lost"],
        },
    },
    {
        id: "notes:add",
        name: "Add note",
        description: "Append a note to the lead profile.",
        parameters: {
            required: ["lead_id", "note"],
            maxLength: 2000,
        },
    },
    {
        id: "demo:fail",
        name: "Demo failure",
        description: "A deterministic failure action used to validate audit UX.",
        parameters: {
            required: ["lead_id"],
            failureMode: "always",
        },
    },
];

export function listAssistantActions(): AssistantActionApi[] {
    return [...ACTIONS];
}

export function toApiRun(run: StoredAssistantRun): AssistantRunApi {
    const { owner_token: _owner, ...rest } = run;
    void _owner;
    return rest;
}

export function getAssistantRun(input: { ownerToken: string; id: string }): StoredAssistantRun | null {
    const store = getStore();
    const found = store.runsById.get(input.id);
    if (!found) return null;
    if (found.owner_token !== input.ownerToken) return null;
    return found;
}

export function listAssistantRuns(input: {
    ownerToken: string;
    statuses?: Array<StoredAssistantRun["status"]>;
    actionType?: string;
    leadId?: string;
    from?: string;
    to?: string;
    sortKey?: "created_at" | "started_at" | "completed_at" | "status" | "action_type" | "source" | "lead_id";
    sortDir?: "asc" | "desc";
}): StoredAssistantRun[] {
    const store = getStore();
    const statusesSet = input.statuses?.length ? new Set(input.statuses) : null;
    const fromMs = input.from ? Date.parse(input.from) : undefined;
    const toMs = input.to ? Date.parse(input.to) : undefined;
    const hasFrom = typeof fromMs === "number" && Number.isFinite(fromMs);
    const hasTo = typeof toMs === "number" && Number.isFinite(toMs);

    const items = Array.from(store.runsById.values()).filter((r) => {
        if (r.owner_token !== input.ownerToken) return false;
        if (statusesSet && !statusesSet.has(r.status)) return false;
        if (input.actionType && r.action_type !== input.actionType) return false;
        if (input.leadId && (r.lead_id ?? undefined) !== input.leadId) return false;

        if (hasFrom || hasTo) {
            const cm = Date.parse(r.created_at);
            if (hasFrom && Number.isFinite(cm) && cm < fromMs) return false;
            if (hasTo && Number.isFinite(cm) && cm > toMs) return false;
        }
        return true;
    });

    const dir = input.sortDir === "asc" ? 1 : -1;
    const key = input.sortKey ?? "created_at";
    items.sort((a, b) => {
        const as = (a as Record<string, unknown>)[key];
        const bs = (b as Record<string, unknown>)[key];
        const am = typeof as === "string" ? Date.parse(as) : NaN;
        const bm = typeof bs === "string" ? Date.parse(bs) : NaN;
        if (Number.isFinite(am) && Number.isFinite(bm)) return (am - bm) * dir;
        const at = String(as ?? "");
        const bt = String(bs ?? "");
        return at.localeCompare(bt) * dir;
    });

    return items;
}

export function createAssistantRun(input: {
    ownerToken: string;
    action_type: string;
    source: string;
    lead_id?: string | null;
    request_payload?: unknown;
}): StoredAssistantRun {
    const now = new Date().toISOString();
    const id = randomId("run");
    const created: StoredAssistantRun = {
        id,
        owner_token: input.ownerToken,
        action_type: input.action_type,
        source: input.source,
        lead_id: input.lead_id ?? null,
        status: "pending",
        created_at: now,
        started_at: null,
        completed_at: null,
        result: null,
        request_payload: input.request_payload,
        response_payload: undefined,
        error: undefined,
    };
    const store = getStore();
    store.runsById.set(id, created);
    return created;
}

export function updateAssistantRun(input: { ownerToken: string; id: string; patch: Partial<Omit<StoredAssistantRun, "id" | "owner_token">> }) {
    const store = getStore();
    const cur = store.runsById.get(input.id);
    if (!cur) return null;
    if (cur.owner_token !== input.ownerToken) return null;
    const next: StoredAssistantRun = { ...cur, ...input.patch };
    store.runsById.set(input.id, next);
    return next;
}

export function startAndScheduleCompletion(input: {
    ownerToken: string;
    id: string;
    context: Record<string, unknown>;
}): StoredAssistantRun | null {
    const startedAt = new Date().toISOString();
    const started = updateAssistantRun({ ownerToken: input.ownerToken, id: input.id, patch: { status: "in_progress", started_at: startedAt } });
    if (!started) return null;

    const delayMs = 800 + Math.floor(Math.random() * 900);
    setTimeout(() => {
        try {
            const current = getAssistantRun({ ownerToken: input.ownerToken, id: input.id });
            if (!current) return;
            if (current.status !== "in_progress") return;

            const action = ACTIONS.find((a) => a.id === current.action_type);
            const shouldFail = current.action_type === "demo:fail" || input.context.fail === true;

            if (!action) {
                updateAssistantRun({
                    ownerToken: input.ownerToken,
                    id: input.id,
                    patch: {
                        status: "failed",
                        completed_at: new Date().toISOString(),
                        result: "Unknown action type.",
                        error: {
                            code: "unknown_action",
                            message: `Action type '${current.action_type}' is not registered.`,
                            nextSteps: ["Refresh the page to reload the catalog.", "Select a known action type from the catalog.", "Contact support if the problem persists."],
                            retryable: false,
                            docsUrl: "https://docs.talk-lee.ai/troubleshooting/assistant-actions",
                        },
                    },
                });
                return;
            }

            if (shouldFail) {
                updateAssistantRun({
                    ownerToken: input.ownerToken,
                    id: input.id,
                    patch: {
                        status: "failed",
                        completed_at: new Date().toISOString(),
                        result: "Execution failed.",
                        response_payload: { ok: false },
                        error: {
                            code: "execution_failed",
                            message: "The action failed during execution.",
                            nextSteps: ["Open the run details and inspect request/response payloads.", "Fix invalid inputs in the context JSON and retry.", "If this is unexpected, contact support with the run id."],
                            retryable: true,
                            docsUrl: "https://docs.talk-lee.ai/troubleshooting/assistant-actions",
                        },
                    },
                });
                return;
            }

            updateAssistantRun({
                ownerToken: input.ownerToken,
                id: input.id,
                patch: {
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    result: `${action.name} completed successfully.`,
                    response_payload: { ok: true, action: current.action_type, lead_id: current.lead_id ?? null },
                    error: undefined,
                },
            });
        } catch (err) {
            captureException(err, { area: "assistant-runs-store", op: "complete" });
            try {
                updateAssistantRun({
                    ownerToken: input.ownerToken,
                    id: input.id,
                    patch: {
                        status: "failed",
                        completed_at: new Date().toISOString(),
                        result: "Execution failed.",
                        error: {
                            code: "server_error",
                            message: "The server encountered an unexpected error while completing the run.",
                            nextSteps: ["Retry the action.", "If the error persists, contact support with the run id."],
                            retryable: true,
                            docsUrl: "https://docs.talk-lee.ai/troubleshooting/network",
                        },
                    },
                });
            } catch {}
        }
    }, delayMs);

    return started;
}
