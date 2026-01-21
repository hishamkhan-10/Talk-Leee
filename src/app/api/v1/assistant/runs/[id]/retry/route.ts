import { NextResponse, type NextRequest } from "next/server";
import { captureException } from "@/lib/monitoring";
import { createAssistantRun, getAssistantRun, startAndScheduleCompletion, toApiRun, updateAssistantRun } from "@/lib/server/assistant-runs-store";

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

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const reqId = requestId();
    const token = readAuthToken(req);
    if (!token) return jsonError({ status: 401, detail: "Unauthorized", reqId });

    const { id } = await ctx.params;
    if (!id) return jsonError({ status: 400, detail: "Missing id", reqId });

    try {
        const prev = getAssistantRun({ ownerToken: token, id });
        if (!prev) return jsonError({ status: 404, detail: "Not found", reqId });

        const reqPayload =
            prev.request_payload && typeof prev.request_payload === "object" && prev.request_payload !== null
                ? { ...(prev.request_payload as Record<string, unknown>), retry_of: prev.id }
                : { action_type: prev.action_type, source: prev.source, lead_id: prev.lead_id ?? undefined, context: {}, retry_of: prev.id };

        const created = createAssistantRun({
            ownerToken: token,
            action_type: prev.action_type,
            source: prev.source,
            lead_id: prev.lead_id ?? null,
            request_payload: reqPayload,
        });

        const context =
            typeof (reqPayload as Record<string, unknown>).context === "object" && (reqPayload as Record<string, unknown>).context !== null
                ? ((reqPayload as Record<string, unknown>).context as Record<string, unknown>)
                : {};

        const started = startAndScheduleCompletion({ ownerToken: token, id: created.id, context });
        if (!started) {
            const failed = updateAssistantRun({
                ownerToken: token,
                id: created.id,
                patch: {
                    status: "failed",
                    started_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    result: "Could not start retry.",
                    error: {
                        code: "retry_failed",
                        message: "The server could not start the retry run.",
                        nextSteps: ["Retry again.", "If persistent, contact support with request id."],
                        retryable: true,
                        docsUrl: "https://docs.talk-lee.ai/troubleshooting/network",
                    },
                },
            });
            return NextResponse.json(toApiRun(failed ?? created), { status: 200, headers: { "x-request-id": reqId } });
        }

        return NextResponse.json(toApiRun(started), { status: 200, headers: { "x-request-id": reqId } });
    } catch (err) {
        captureException(err, { area: "assistant-runs-retry", method: "POST", reqId });
        return jsonError({ status: 500, detail: "Server error", reqId });
    }
}

