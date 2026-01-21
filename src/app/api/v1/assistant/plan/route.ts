import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { captureException } from "@/lib/monitoring";
import { listAssistantActions } from "@/lib/server/assistant-runs-store";

function requestId() {
    try {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    } catch {}
    return `req_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function jsonError(input: { status: number; detail: string; reqId: string }) {
    return NextResponse.json({ detail: input.detail }, { status: input.status, headers: { "x-request-id": input.reqId } });
}

function readAuthToken(req: NextRequest) {
    const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
    const m = auth?.match(/^Bearer\s+(.+)$/i);
    if (m?.[1]) return m[1].trim();
    const cookie = req.cookies.get("talklee_auth_token")?.value;
    if (cookie && cookie.trim().length > 0) return cookie.trim();
    return null;
}

const PlanSchema = z.object({
    action_type: z.string().trim().min(1),
    source: z.string().trim().min(1).optional(),
    lead_id: z.string().trim().min(1).optional(),
    context: z.record(z.unknown()).optional(),
});

function randomId(prefix: string) {
    try {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
    } catch {}
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export async function POST(req: NextRequest) {
    const reqId = requestId();
    const token = readAuthToken(req);
    if (!token) return jsonError({ status: 401, detail: "Unauthorized", reqId });

    try {
        const body = await req.json().catch(() => undefined);
        const parsed = PlanSchema.safeParse(body);
        if (!parsed.success) return jsonError({ status: 400, detail: "Invalid payload", reqId });
        if (!parsed.data.lead_id) return jsonError({ status: 400, detail: "Missing lead_id", reqId });

        const action = listAssistantActions().find((a) => a.id === parsed.data.action_type);
        if (!action) return jsonError({ status: 404, detail: "Unknown action_type", reqId });

        const required = Array.isArray((action.parameters as { required?: unknown }).required) ? ((action.parameters as { required?: string[] }).required ?? []) : [];
        const ctx = parsed.data.context ?? {};
        const missing = required.filter((k) => k !== "lead_id" && (ctx as Record<string, unknown>)[k] === undefined);
        const steps: unknown[] = [
            { step: 1, title: "Validate inputs", details: { action_type: parsed.data.action_type, lead_id: parsed.data.lead_id, missing_context_keys: missing } },
            { step: 2, title: "Compute safe changeset", details: { mode: "dry-run", constraints: ["no external side effects during planning"] } },
            { step: 3, title: "Execute with audit trail", details: { writes: ["assistant_runs"], retention: "workspace" } },
        ];
        const summary =
            missing.length > 0
                ? `Missing required context keys: ${missing.join(", ")}. Fix the context JSON before executing.`
                : `Ready to execute '${parsed.data.action_type}' for lead '${parsed.data.lead_id}'.`;

        return NextResponse.json(
            { planId: randomId("plan"), summary, steps, estimatedImpact: { writes: 1, externalCalls: 0 } },
            { status: 200, headers: { "x-request-id": reqId } }
        );
    } catch (err) {
        captureException(err, { area: "assistant-plan", method: "POST", reqId });
        return jsonError({ status: 500, detail: "Server error", reqId });
    }
}

