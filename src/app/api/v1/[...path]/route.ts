import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildResponsiveHtmlDocument } from "@/lib/email-utils";

type RouteContext = { params: Promise<{ path?: string[] }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type EmailTemplate = { id: string; name: string; html: string; locked?: boolean; thumbnailUrl?: string; updatedAt?: string };

function emailTemplates(): EmailTemplate[] {
    return [
        {
            id: "tpl-basic",
            name: "Basic",
            html: buildResponsiveHtmlDocument(
                `<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827;">
                    <h1 style="margin: 0 0 12px; font-size: 20px; line-height: 28px;">Hello</h1>
                    <p style="margin: 0 0 12px; font-size: 14px; line-height: 22px;">This is a test email from Talk-Lee.</p>
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #6b7280;">If you did not expect this message, you can ignore it.</p>
                </div>`
            ),
            locked: false,
            updatedAt: nowIso(),
        },
        {
            id: "tpl-reminder",
            name: "Reminder",
            html: buildResponsiveHtmlDocument(
                `<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827;">
                    <h1 style="margin: 0 0 12px; font-size: 20px; line-height: 28px;">Reminder</h1>
                    <p style="margin: 0 0 12px; font-size: 14px; line-height: 22px;">You have an upcoming item.</p>
                    <div style="margin: 16px 0; padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb;">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">Details</div>
                        <div style="font-size: 14px; color: #111827;">Scheduled reminder</div>
                    </div>
                </div>`
            ),
            locked: false,
            updatedAt: nowIso(),
        },
    ];
}

function requireEnv(name: string) {
    const v = process.env[name];
    if (!v || !String(v).trim()) throw new Error(`Missing environment variable: ${name}`);
    return String(v).trim();
}

function optionalEnv(name: string) {
    const v = process.env[name];
    if (!v || !String(v).trim()) return undefined;
    return String(v).trim();
}

function parseBoolEnv(name: string, fallback: boolean) {
    const raw = optionalEnv(name);
    if (raw === undefined) return fallback;
    if (raw === "1" || /^true$/i.test(raw)) return true;
    if (raw === "0" || /^false$/i.test(raw)) return false;
    throw new Error(`Invalid boolean for ${name}: ${raw}`);
}

let cachedTransport: nodemailer.Transporter | undefined;
let cachedVerify: Promise<void> | undefined;

function createEmailTransport() {
    if (cachedTransport) return cachedTransport;
    const transportMode = optionalEnv("SMTP_TRANSPORT")?.toLowerCase();
    const smtpUrl = optionalEnv("SMTP_URL");
    const smtpHost = optionalEnv("SMTP_HOST");
    if (transportMode === "stream" || (!transportMode && process.env.NODE_ENV !== "production" && !smtpUrl && !smtpHost)) {
        cachedTransport = nodemailer.createTransport({
            streamTransport: true,
            newline: "unix",
            buffer: true,
        });
        cachedVerify = Promise.resolve();
        return cachedTransport;
    }
    if (smtpUrl) {
        cachedTransport = nodemailer.createTransport(smtpUrl);
        return cachedTransport;
    }

    const host = requireEnv("SMTP_HOST");
    const portRaw = optionalEnv("SMTP_PORT");
    const port = portRaw ? Number(portRaw) : 587;
    if (!Number.isFinite(port) || port <= 0) throw new Error(`Invalid SMTP_PORT: ${portRaw ?? ""}`);

    const secure = parseBoolEnv("SMTP_SECURE", port === 465);

    const user = optionalEnv("SMTP_USER");
    const pass = optionalEnv("SMTP_PASS");
    if (user && !pass) throw new Error("Missing SMTP_PASS");
    if (!user && pass) throw new Error("Missing SMTP_USER");

    const rejectUnauthorized = parseBoolEnv("SMTP_TLS_REJECT_UNAUTHORIZED", true);

    cachedTransport = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user ? { user, pass: pass! } : undefined,
        tls: { rejectUnauthorized },
    });
    return cachedTransport;
}

function getConfiguredFrom() {
    const from = optionalEnv("EMAIL_FROM");
    if (!from) {
        const transportMode = optionalEnv("SMTP_TRANSPORT")?.toLowerCase();
        if (process.env.NODE_ENV !== "production" || transportMode === "stream") return "Talk-Lee <noreply@example.com>";
        throw new Error("Missing environment variable: EMAIL_FROM");
    }
    if (!/@/.test(from)) throw new Error("EMAIL_FROM must include an email address (e.g. \"Talk-Lee <noreply@yourdomain.com>\")");
    return from;
}

function inferSubject(input: { subject?: string; templateName?: string }) {
    const s = input.subject?.trim();
    if (s) return s;
    if (input.templateName) return input.templateName;
    return "Talk-Lee";
}

function htmlToText(html: string) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p\s*>/gi, "\n\n")
        .replace(/<\/div\s*>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

async function sendEmail(input: { to: string[]; subject?: string; html: string }) {
    const from = getConfiguredFrom();
    const replyTo = optionalEnv("EMAIL_REPLY_TO");
    const listUnsubscribe = optionalEnv("EMAIL_LIST_UNSUBSCRIBE");

    const transport = createEmailTransport();
    if (!cachedVerify) {
        cachedVerify = transport.verify().then(() => undefined);
        cachedVerify.catch(() => {
            cachedVerify = undefined;
            cachedTransport = undefined;
        });
    }
    await cachedVerify;

    const html = buildResponsiveHtmlDocument(input.html);
    const info = await transport.sendMail({
        from,
        to: input.to.join(", "),
        subject: inferSubject({ subject: input.subject }),
        html,
        text: htmlToText(html),
        ...(replyTo ? { replyTo } : {}),
        headers: {
            ...(listUnsubscribe ? { "List-Unsubscribe": listUnsubscribe } : {}),
        },
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted.length : 0;
    const rejected = Array.isArray(info.rejected) ? info.rejected.length : 0;
    const status = accepted > 0 && rejected === 0 ? "sent" : accepted > 0 ? "partial" : "failed";

    return { messageId: info.messageId, status, accepted: info.accepted, rejected: info.rejected, response: info.response };
}

async function handle(request: Request, segments: string[]) {
    const method = request.method.toUpperCase();
    const path = `/${segments.join("/")}`;

    if (method === "GET" && path === "/health") {
        return json({ status: "ok" });
    }

    if (method === "GET" && path === "/email/templates") {
        return json({ items: emailTemplates() });
    }

    if (method === "POST" && path === "/email/send") {
        const body = (await readJsonBody(request)) as
            | { to?: unknown; recipients?: unknown; template_id?: unknown; templateId?: unknown; subject?: unknown; html?: unknown }
            | undefined;

        const to = Array.isArray(body?.to)
            ? body?.to.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
            : Array.isArray(body?.recipients)
              ? body?.recipients.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
              : [];
        const templateId =
            typeof body?.templateId === "string"
                ? body.templateId
                : typeof body?.template_id === "string"
                  ? body.template_id
                  : undefined;
        const subject = typeof body?.subject === "string" ? body.subject : undefined;
        const htmlOverride = typeof body?.html === "string" ? body.html : undefined;

        if (to.length === 0) return json({ detail: "Missing recipients" }, { status: 400 });
        if (!templateId && !htmlOverride) return json({ detail: "Missing template_id or html" }, { status: 400 });

        const templates = emailTemplates();
        const template = templateId ? templates.find((t) => t.id === templateId) : undefined;

        const html = htmlOverride ?? template?.html;
        if (!html) return json({ detail: `Unknown template_id: ${templateId}` }, { status: 400 });

        try {
            const out = await sendEmail({ to, subject: subject ?? template?.name, html });
            return json(out);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Email send failed";
            return json({ detail: message }, { status: 500 });
        }
    }

    if (process.env.NODE_ENV === "production") {
        return json({ error: "Not found" }, { status: 404 });
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
