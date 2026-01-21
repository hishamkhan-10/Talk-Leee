import { NextResponse, type NextRequest } from "next/server";
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

export async function GET(req: NextRequest) {
    const reqId = requestId();
    const token = readAuthToken(req);
    if (!token) return jsonError({ status: 401, detail: "Unauthorized", reqId });

    try {
        return NextResponse.json({ items: listAssistantActions() }, { status: 200, headers: { "x-request-id": reqId } });
    } catch (err) {
        captureException(err, { area: "assistant-actions", method: "GET", reqId });
        return jsonError({ status: 500, detail: "Server error", reqId });
    }
}

