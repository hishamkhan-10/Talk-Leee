import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { captureException } from "@/lib/monitoring";
import { deleteCalendarEvent, toApiEvent, updateCalendarEvent } from "@/lib/server/calendar-events-store";

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

const PatchSchema = z
    .object({
        title: z.string().trim().min(1).max(100).optional(),
        start_time: z.string().datetime().optional(),
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
    })
    .strict();

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const reqId = requestId();
    const token = readAuthToken(req);
    if (!token) return jsonError({ status: 401, detail: "Unauthorized", reqId });

    const { id } = await ctx.params;
    if (!id) return jsonError({ status: 400, detail: "Missing id", reqId });

    try {
        const body = await req.json().catch(() => undefined);
        const parsed = PatchSchema.safeParse(body);
        if (!parsed.success) return jsonError({ status: 400, detail: "Invalid payload", reqId });

        const patch = parsed.data;
        if (patch.start_time) {
            const startMs = Date.parse(patch.start_time);
            if (!Number.isFinite(startMs)) return jsonError({ status: 400, detail: "Invalid start_time", reqId });
            if (patch.end_time) {
                const endMs = Date.parse(patch.end_time);
                if (!Number.isFinite(endMs)) return jsonError({ status: 400, detail: "Invalid end_time", reqId });
                if (endMs <= startMs) return jsonError({ status: 400, detail: "end_time must be after start_time", reqId });
            }
        }

        const updated = updateCalendarEvent({ ownerToken: token, id, patch });
        if (!updated) return jsonError({ status: 404, detail: "Not found", reqId });
        return NextResponse.json(toApiEvent(updated), { status: 200, headers: { "x-request-id": reqId } });
    } catch (err) {
        captureException(err, { area: "calendar-events", method: "PATCH", reqId, id });
        return jsonError({ status: 500, detail: "Server error", reqId });
    }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const reqId = requestId();
    const token = readAuthToken(req);
    if (!token) return jsonError({ status: 401, detail: "Unauthorized", reqId });

    const { id } = await ctx.params;
    if (!id) return jsonError({ status: 400, detail: "Missing id", reqId });

    try {
        const res = deleteCalendarEvent({ ownerToken: token, id });
        if (!res.ok) {
            if (res.forbidden) return jsonError({ status: 403, detail: "Forbidden", reqId });
            return jsonError({ status: 404, detail: "Not found", reqId });
        }
        return new NextResponse("", { status: 200, headers: { "x-request-id": reqId } });
    } catch (err) {
        captureException(err, { area: "calendar-events", method: "DELETE", reqId, id });
        return jsonError({ status: 500, detail: "Server error", reqId });
    }
}

