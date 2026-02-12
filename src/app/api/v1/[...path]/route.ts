import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ path?: string[] }> };

function json(data: unknown, init?: { status?: number }) {
    return NextResponse.json(data, {
        status: init?.status ?? 200,
        headers: { "cache-control": "no-store" },
    });
}

function nowIso() {
    return new Date().toISOString();
}

async function readJsonBody(request: Request) {
    try {
        return await request.json();
    } catch {
        return undefined;
    }
}

async function handle(request: Request, segments: string[]) {
    if (process.env.NODE_ENV === "production") {
        return json({ error: "Not found" }, { status: 404 });
    }

    const method = request.method.toUpperCase();
    const path = `/${segments.join("/")}`;

    if (method === "GET" && path === "/health") {
        return json({ status: "ok" });
    }

    if (method === "GET" && path === "/connectors") {
        return json({ items: [] });
    }

    if (method === "POST" && path === "/connectors") {
        const body = (await readJsonBody(request)) as { name?: string; type?: string; config?: Record<string, unknown> } | undefined;
        return json({
            id: `connector-${Math.random().toString(16).slice(2)}`,
            name: body?.name ?? "Connector",
            type: body?.type ?? "unknown",
            config: body?.config ?? {},
            createdAt: nowIso(),
        });
    }

    if (method === "GET" && path === "/connectors/status") {
        return json({
            items: [
                { type: "calendar", status: "disconnected", last_sync: null, error_message: null, provider: null },
                { type: "email", status: "disconnected", last_sync: null, error_message: null, provider: null },
                { type: "crm", status: "disconnected", last_sync: null, error_message: null, provider: null },
                { type: "drive", status: "disconnected", last_sync: null, error_message: null, provider: null },
            ],
        });
    }

    {
        const m = path.match(/^\/connectors\/([^/]+)\/authorize$/);
        if (method === "GET" && m) {
            const type = decodeURIComponent(m[1] ?? "");
            const url = new URL(request.url);
            const redirectUri = url.searchParams.get("redirect_uri") || `${url.origin}/connectors/callback?type=${encodeURIComponent(type)}`;
            const redirect = new URL(redirectUri);
            redirect.searchParams.set("type", type);
            if (!redirect.searchParams.has("status")) redirect.searchParams.set("status", "success");
            return json({ authorization_url: redirect.toString() });
        }
    }

    {
        const m = path.match(/^\/connectors\/([^/]+)\/disconnect$/);
        if (method === "POST" && m) {
            return json({ ok: true });
        }
    }

    if (method === "GET" && path === "/connector-accounts") {
        return json({ items: [] });
    }

    if (method === "GET" && path === "/meetings") {
        return json({ items: [] });
    }

    if (method === "GET" && path === "/calendar/events") {
        return json({ items: [], total: 0, page: 1, page_size: 50 });
    }

    if (method === "POST" && path === "/calendar/events") {
        const body = (await readJsonBody(request)) as
            | { lead_id?: string; lead_name?: string; title?: string; start_time?: string; end_time?: string; notes?: string }
            | undefined;
        return json({
            id: `event-${Math.random().toString(16).slice(2)}`,
            title: body?.title ?? "Meeting",
            startTime: body?.start_time ?? nowIso(),
            endTime: body?.end_time ?? undefined,
            status: "scheduled",
            leadId: body?.lead_id ?? undefined,
            leadName: body?.lead_name ?? undefined,
            notes: body?.notes ?? undefined,
            participants: [],
        });
    }

    {
        const m = path.match(/^\/calendar\/events\/([^/]+)$/);
        if (method === "PATCH" && m) {
            const body = (await readJsonBody(request)) as Record<string, unknown> | undefined;
            const title = typeof body?.title === "string" ? body?.title : "Meeting";
            const startTime = typeof body?.start_time === "string" ? body?.start_time : nowIso();
            const endTime = typeof body?.end_time === "string" ? body?.end_time : undefined;
            return json({ id: decodeURIComponent(m[1] ?? ""), title, startTime, endTime, status: "scheduled", participants: [] });
        }
        if (method === "DELETE" && m) {
            return json({ ok: true });
        }
    }

    if (method === "GET" && path === "/reminders") {
        return json({ items: [] });
    }

    if (method === "POST" && path === "/reminders") {
        const body = (await readJsonBody(request)) as
            | {
                  content?: string;
                  channel?: "email" | "sms";
                  scheduled_at?: string;
                  meeting_id?: string;
                  meeting_title?: string;
                  contact_id?: string;
                  contact_name?: string;
                  to_email?: string;
                  to_phone?: string;
              }
            | undefined;
        return json({
            id: `reminder-${Math.random().toString(16).slice(2)}`,
            content: body?.content ?? "",
            status: "scheduled",
            channel: body?.channel ?? "email",
            scheduledAt: body?.scheduled_at ?? nowIso(),
            meetingId: body?.meeting_id ?? undefined,
            meetingTitle: body?.meeting_title ?? undefined,
            contactId: body?.contact_id ?? undefined,
            contactName: body?.contact_name ?? undefined,
            toEmail: body?.to_email ?? undefined,
            toPhone: body?.to_phone ?? undefined,
        });
    }

    {
        const m = path.match(/^\/reminders\/([^/]+)$/);
        if (method === "PATCH" && m) {
            const body = (await readJsonBody(request)) as Record<string, unknown> | undefined;
            return json({
                id: decodeURIComponent(m[1] ?? ""),
                content: typeof body?.content === "string" ? body.content : "",
                status: typeof body?.status === "string" ? body.status : "scheduled",
                channel: typeof body?.channel === "string" ? body.channel : "email",
                scheduledAt: typeof body?.scheduled_at === "string" ? body.scheduled_at : nowIso(),
            });
        }
    }

    {
        const m = path.match(/^\/reminders\/([^/]+)\/cancel$/);
        if (method === "POST" && m) {
            return json({ id: decodeURIComponent(m[1] ?? ""), content: "", status: "canceled", channel: "email", scheduledAt: nowIso() });
        }
    }

    if (method === "GET" && path === "/email/templates") {
        return json({ items: [] });
    }

    if (method === "POST" && path === "/email/send") {
        return json({ messageId: `msg-${Math.random().toString(16).slice(2)}`, status: "queued" });
    }

    if (method === "GET" && path === "/assistant/actions") {
        return json({ items: [] });
    }

    if (method === "GET" && path === "/assistant/runs") {
        return json({ items: [], total: 0, page: 1, page_size: 50 });
    }

    {
        const m = path.match(/^\/assistant\/runs\/([^/]+)\/retry$/);
        if (method === "POST" && m) {
            return json({ id: decodeURIComponent(m[1] ?? ""), actionType: "retry", source: "ui", status: "pending", createdAt: nowIso() });
        }
    }

    if (method === "POST" && path === "/assistant/plan") {
        return json({ summary: "Development mode: plan generated.", steps: [] });
    }

    if (method === "POST" && path === "/assistant/execute") {
        return json({ id: `run-${Math.random().toString(16).slice(2)}`, actionType: "execute", source: "ui", status: "pending", createdAt: nowIso() });
    }

    return json({ error: "Not found" }, { status: 404 });
}

export async function GET(request: Request, ctx: RouteContext) {
    const { path } = await ctx.params;
    return handle(request, path ?? []);
}

export async function POST(request: Request, ctx: RouteContext) {
    const { path } = await ctx.params;
    return handle(request, path ?? []);
}

export async function PATCH(request: Request, ctx: RouteContext) {
    const { path } = await ctx.params;
    return handle(request, path ?? []);
}

export async function DELETE(request: Request, ctx: RouteContext) {
    const { path } = await ctx.params;
    return handle(request, path ?? []);
}

