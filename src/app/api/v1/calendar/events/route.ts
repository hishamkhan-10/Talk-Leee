import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { captureException } from "@/lib/monitoring";
import { createCalendarEvent, listCalendarEvents, toApiEvent } from "@/lib/server/calendar-events-store";

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

const CreateSchema = z.object({
    title: z.string().trim().min(1).max(100),
    start_time: z.string().datetime(),
    end_time: z.string().datetime().optional().nullable(),
    status: z.string().optional().nullable(),
    lead_id: z.string().optional().nullable(),
    lead_name: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    participants: z
        .array(z.object({ id: z.string().optional(), name: z.string().optional(), email: z.string().optional(), role: z.string().optional() }))
        .optional(),
    join_link: z.string().url().optional().nullable(),
    calendar_link: z.string().url().optional().nullable(),
    provider: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
    const reqId = requestId();
    const token = readAuthToken(req);
    if (!token) return jsonError({ status: 401, detail: "Unauthorized", reqId });

    try {
        const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 10_000);
        const pageSize = parsePositiveInt(req.nextUrl.searchParams.get("page_size"), 500) ?? 50;

        const all = listCalendarEvents({ ownerToken: token }).map(toApiEvent);
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
        captureException(err, { area: "calendar-events", method: "GET", reqId });
        return jsonError({ status: 500, detail: "Server error", reqId });
    }
}

export async function POST(req: NextRequest) {
    const reqId = requestId();
    const token = readAuthToken(req);
    if (!token) return jsonError({ status: 401, detail: "Unauthorized", reqId });

    try {
        const body = await req.json().catch(() => undefined);
        const parsed = CreateSchema.safeParse(body);
        if (!parsed.success) return jsonError({ status: 400, detail: "Invalid payload", reqId });

        const startMs = Date.parse(parsed.data.start_time);
        if (!Number.isFinite(startMs)) return jsonError({ status: 400, detail: "Invalid start_time", reqId });
        if (parsed.data.end_time) {
            const endMs = Date.parse(parsed.data.end_time);
            if (!Number.isFinite(endMs)) return jsonError({ status: 400, detail: "Invalid end_time", reqId });
            if (endMs <= startMs) return jsonError({ status: 400, detail: "end_time must be after start_time", reqId });
        }

        const created = createCalendarEvent({ ownerToken: token, ...parsed.data });
        return NextResponse.json(toApiEvent(created), { status: 200, headers: { "x-request-id": reqId } });
    } catch (err) {
        captureException(err, { area: "calendar-events", method: "POST", reqId });
        return jsonError({ status: 500, detail: "Server error", reqId });
    }
}

