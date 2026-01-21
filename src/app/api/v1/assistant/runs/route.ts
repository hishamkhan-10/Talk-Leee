import { NextResponse, type NextRequest } from "next/server";
import { captureException } from "@/lib/monitoring";
import { listAssistantRuns, toApiRun } from "@/lib/server/assistant-runs-store";

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

function parsePositiveInt(value: string | null, max: number) {
    if (!value) return undefined;
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    const i = Math.trunc(n);
    if (i <= 0) return undefined;
    return Math.min(i, max);
}

function normalizeSortKey(raw: string | null) {
    if (!raw) return undefined;
    const k = raw.trim();
    if (k === "createdAt" || k === "created_at") return "created_at";
    if (k === "startedAt" || k === "started_at") return "started_at";
    if (k === "completedAt" || k === "completed_at") return "completed_at";
    if (k === "actionType" || k === "action_type") return "action_type";
    if (k === "leadId" || k === "lead_id") return "lead_id";
    if (k === "source") return "source";
    if (k === "status") return "status";
    return undefined;
}

function normalizeSortDir(raw: string | null) {
    const v = (raw ?? "").trim().toLowerCase();
    if (v === "asc" || v === "desc") return v;
    return undefined;
}

export async function GET(req: NextRequest) {
    const reqId = requestId();
    const token = readAuthToken(req);
    if (!token) return jsonError({ status: 401, detail: "Unauthorized", reqId });

    try {
        const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 10_000);
        const pageSize = parsePositiveInt(req.nextUrl.searchParams.get("page_size"), 500) ?? 50;

        const statusCsv = req.nextUrl.searchParams.get("status");
        const statuses = statusCsv
            ? statusCsv
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .filter((s): s is "pending" | "in_progress" | "completed" | "failed" => ["pending", "in_progress", "completed", "failed"].includes(s))
            : undefined;

        const actionType = req.nextUrl.searchParams.get("action_type") ?? undefined;
        const leadId = req.nextUrl.searchParams.get("lead_id") ?? undefined;
        const from = req.nextUrl.searchParams.get("from") ?? undefined;
        const to = req.nextUrl.searchParams.get("to") ?? undefined;
        const sortKey = normalizeSortKey(req.nextUrl.searchParams.get("sort_key"));
        const sortDir = normalizeSortDir(req.nextUrl.searchParams.get("sort_dir"));

        const all = listAssistantRuns({ ownerToken: token, statuses, actionType, leadId, from, to, sortKey, sortDir }).map(toApiRun);
        if (page) {
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            return NextResponse.json(
                { items: all.slice(start, end), total: all.length, page, page_size: pageSize },
                { status: 200, headers: { "x-request-id": reqId } }
            );
        }
        return NextResponse.json({ items: all }, { status: 200, headers: { "x-request-id": reqId } });
    } catch (err) {
        captureException(err, { area: "assistant-runs", method: "GET", reqId });
        return jsonError({ status: 500, detail: "Server error", reqId });
    }
}

