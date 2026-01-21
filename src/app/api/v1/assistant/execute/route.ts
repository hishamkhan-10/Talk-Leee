import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { captureException } from "@/lib/monitoring";
import { createAssistantRun, listAssistantActions, startAndScheduleCompletion, toApiRun, updateAssistantRun } from "@/lib/server/assistant-runs-store";

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

const ExecuteSchema = z.object({
    action_type: z.string().trim().min(1),
    source: z.string().trim().min(1).optional(),
    lead_id: z.string().trim().min(1).optional(),
    context: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
    const reqId = requestId();
    const token = readAuthToken(req);
    if (!token) return jsonError({ status: 401, detail: "Unauthorized", reqId });

    try {
        const body = await req.json().catch(() => undefined);
        const parsed = ExecuteSchema.safeParse(body);
        const action_type = parsed.success ? parsed.data.action_type : "unknown";
        const source = parsed.success ? parsed.data.source ?? "dashboard" : "dashboard";
        const lead_id = parsed.success ? parsed.data.lead_id : undefined;
        const context = parsed.success ? parsed.data.context ?? {} : {};

        const created = createAssistantRun({
            ownerToken: token,
            action_type,
            source,
            lead_id: lead_id ?? null,
            request_payload: { action_type, source, lead_id: lead_id ?? undefined, context },
        });

        if (!parsed.success) {
            const failed = updateAssistantRun({
                ownerToken: token,
                id: created.id,
                patch: {
                    status: "failed",
                    started_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    result: "Invalid request payload.",
                    error: {
                        code: "invalid_payload",
                        message: "The execution request payload is invalid.",
                        nextSteps: ["Ensure action_type is provided.", "Ensure lead_id is provided.", "Ensure context is a JSON object."],
                        retryable: false,
                        docsUrl: "https://docs.talk-lee.ai/troubleshooting/assistant-actions",
                    },
                    response_payload: { ok: false },
                },
            });
            return NextResponse.json(toApiRun(failed ?? created), { status: 200, headers: { "x-request-id": reqId } });
        }

        if (!parsed.data.lead_id) {
            const failed = updateAssistantRun({
                ownerToken: token,
                id: created.id,
                patch: {
                    status: "failed",
                    started_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    result: "Missing lead_id.",
                    error: {
                        code: "missing_lead",
                        message: "lead_id is required to execute this action.",
                        nextSteps: ["Select a lead in the Run Action panel.", "Retry the action after selecting a lead."],
                        retryable: false,
                        docsUrl: "https://docs.talk-lee.ai/troubleshooting/assistant-actions",
                    },
                    response_payload: { ok: false },
                },
            });
            return NextResponse.json(toApiRun(failed ?? created), { status: 200, headers: { "x-request-id": reqId } });
        }

        const action = listAssistantActions().find((a) => a.id === parsed.data.action_type);
        if (!action) {
            const failed = updateAssistantRun({
                ownerToken: token,
                id: created.id,
                patch: {
                    status: "failed",
                    started_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    result: "Unknown action type.",
                    error: {
                        code: "unknown_action",
                        message: `Action type '${parsed.data.action_type}' is not registered.`,
                        nextSteps: ["Select a known action type from the dropdown.", "Reload the page to refresh the catalog."],
                        retryable: false,
                        docsUrl: "https://docs.talk-lee.ai/troubleshooting/assistant-actions",
                    },
                    response_payload: { ok: false },
                },
            });
            return NextResponse.json(toApiRun(failed ?? created), { status: 200, headers: { "x-request-id": reqId } });
        }

        const required = Array.isArray((action.parameters as { required?: unknown }).required) ? ((action.parameters as { required?: string[] }).required ?? []) : [];
        const missing = required.filter((k) => k !== "lead_id" && (context as Record<string, unknown>)[k] === undefined);
        if (missing.length > 0) {
            const failed = updateAssistantRun({
                ownerToken: token,
                id: created.id,
                patch: {
                    status: "failed",
                    started_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    result: `Missing required context keys: ${missing.join(", ")}.`,
                    error: {
                        code: "missing_context",
                        message: `Context is missing required keys: ${missing.join(", ")}.`,
                        nextSteps: ["Click Plan/preview to see required inputs.", "Update the context JSON with missing keys and retry.", "If unsure, use the action catalog to inspect parameters."],
                        retryable: false,
                        docsUrl: "https://docs.talk-lee.ai/troubleshooting/assistant-actions",
                    },
                    response_payload: { ok: false, missing },
                },
            });
            return NextResponse.json(toApiRun(failed ?? created), { status: 200, headers: { "x-request-id": reqId } });
        }

        const started = startAndScheduleCompletion({ ownerToken: token, id: created.id, context });
        return NextResponse.json(toApiRun(started ?? created), { status: 200, headers: { "x-request-id": reqId } });
    } catch (err) {
        captureException(err, { area: "assistant-execute", method: "POST", reqId });
        return jsonError({ status: 500, detail: "Server error", reqId });
    }
}

