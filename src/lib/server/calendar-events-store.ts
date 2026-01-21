import { captureException } from "@/lib/monitoring";

export type StoredCalendarEvent = {
    id: string;
    owner_token: string;
    title: string;
    start_time: string;
    end_time?: string | null;
    status?: string | null;
    lead_id?: string | null;
    lead_name?: string | null;
    notes?: string | null;
    participants?: Array<{ id?: string; name?: string; email?: string; role?: string }>;
    join_link?: string | null;
    calendar_link?: string | null;
    provider?: string | null;
    created_at: string;
    updated_at: string;
};

export type CalendarEventApi = Omit<StoredCalendarEvent, "owner_token">;

type Store = {
    byId: Map<string, StoredCalendarEvent>;
};

function getStore(): Store {
    const key = "__talklee_calendar_events_store__";
    const g = globalThis as unknown as { [k: string]: Store | undefined };
    if (!g[key]) g[key] = { byId: new Map() };
    return g[key]!;
}

function randomId() {
    try {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    } catch {}
    return `evt_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeUrlCandidate(value: string) {
    const trimmed = value.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return undefined;
    try {
        const u = new URL(trimmed);
        if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
        return u.toString();
    } catch {
        return undefined;
    }
}

function findFirstUrl(text: string) {
    const m = text.match(/https?:\/\/[^\s)]+/i);
    if (!m) return undefined;
    return safeUrlCandidate(m[0] ?? "");
}

function toCompactUtc(iso: string) {
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms)) return undefined;
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(
        d.getUTCSeconds()
    )}Z`;
}

function defaultEndTime(startIso: string) {
    const ms = Date.parse(startIso);
    if (!Number.isFinite(ms)) return undefined;
    return new Date(ms + 30 * 60_000).toISOString();
}

function buildCalendarLink(input: { provider?: string | null; title: string; start_time: string; end_time?: string | null; notes?: string | null }) {
    const provider = (input.provider ?? "google").toLowerCase();
    const start = toCompactUtc(input.start_time);
    const end = toCompactUtc(input.end_time ?? defaultEndTime(input.start_time) ?? input.start_time);
    if (provider.includes("microsoft") || provider.includes("outlook")) {
        try {
            const url = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
            url.searchParams.set("subject", input.title);
            url.searchParams.set("startdt", input.start_time);
            if (input.end_time) url.searchParams.set("enddt", input.end_time);
            if (input.notes) url.searchParams.set("body", input.notes);
            return url.toString();
        } catch {
            return undefined;
        }
    }
    if (!start || !end) return undefined;
    try {
        const url = new URL("https://calendar.google.com/calendar/u/0/r/eventedit");
        url.searchParams.set("text", input.title);
        url.searchParams.set("dates", `${start}/${end}`);
        if (input.notes) url.searchParams.set("details", input.notes);
        return url.toString();
    } catch {
        return undefined;
    }
}

export function toApiEvent(e: StoredCalendarEvent): CalendarEventApi {
    const { owner_token: _owner, ...rest } = e;
    void _owner;
    return rest;
}

export function listCalendarEvents(input: { ownerToken: string }) {
    const store = getStore();
    const all = Array.from(store.byId.values()).filter((e) => e.owner_token === input.ownerToken);
    all.sort((a, b) => {
        const am = Date.parse(a.start_time);
        const bm = Date.parse(b.start_time);
        if (!Number.isFinite(am) && !Number.isFinite(bm)) return 0;
        if (!Number.isFinite(am)) return 1;
        if (!Number.isFinite(bm)) return -1;
        return am - bm;
    });
    return all;
}

export function createCalendarEvent(input: {
    ownerToken: string;
    title: string;
    start_time: string;
    end_time?: string | null;
    status?: string | null;
    lead_id?: string | null;
    lead_name?: string | null;
    notes?: string | null;
    participants?: Array<{ id?: string; name?: string; email?: string; role?: string }>;
    join_link?: string | null;
    calendar_link?: string | null;
    provider?: string | null;
}): StoredCalendarEvent {
    const now = new Date().toISOString();
    const id = randomId();
    const joinLink = input.join_link ?? (input.notes ? findFirstUrl(input.notes) : undefined) ?? null;
    const calendarLink = input.calendar_link ?? buildCalendarLink(input) ?? null;
    const created: StoredCalendarEvent = {
        id,
        owner_token: input.ownerToken,
        title: input.title,
        start_time: input.start_time,
        end_time: input.end_time ?? null,
        status: input.status ?? "scheduled",
        lead_id: input.lead_id ?? null,
        lead_name: input.lead_name ?? null,
        notes: input.notes ?? null,
        participants: input.participants,
        join_link: joinLink,
        calendar_link: calendarLink,
        provider: input.provider ?? null,
        created_at: now,
        updated_at: now,
    };

    try {
        const store = getStore();
        store.byId.set(id, created);
    } catch (err) {
        captureException(err, { area: "calendar-events-store", op: "create" });
        throw err;
    }
    return created;
}

export function updateCalendarEvent(input: {
    ownerToken: string;
    id: string;
    patch: Partial<Omit<StoredCalendarEvent, "id" | "owner_token" | "created_at" | "updated_at">>;
}): StoredCalendarEvent | null {
    const store = getStore();
    const found = store.byId.get(input.id);
    if (!found) return null;
    if (found.owner_token !== input.ownerToken) return null;

    const next: StoredCalendarEvent = {
        ...found,
        ...input.patch,
        updated_at: new Date().toISOString(),
    };

    if (next.join_link === undefined && next.notes) {
        next.join_link = findFirstUrl(next.notes) ?? null;
    }
    if (next.calendar_link === undefined) {
        next.calendar_link =
            buildCalendarLink({
                provider: next.provider,
                title: next.title,
                start_time: next.start_time,
                end_time: next.end_time ?? undefined,
                notes: next.notes ?? undefined,
            }) ?? null;
    }

    store.byId.set(input.id, next);
    return next;
}

export function deleteCalendarEvent(input: { ownerToken: string; id: string }): { ok: boolean; forbidden?: boolean } {
    const store = getStore();
    const found = store.byId.get(input.id);
    if (!found) return { ok: false };
    if (found.owner_token !== input.ownerToken) return { ok: false, forbidden: true };
    store.byId.delete(input.id);
    return { ok: true };
}
