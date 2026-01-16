import { test } from "node:test";
import assert from "node:assert/strict";

test("backendApi.calendarEvents.list calls calendar events list endpoint", async () => {
    const prevFetch = globalThis.fetch;
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(url), init });
        return new Response(JSON.stringify({ items: [] }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;

    try {
        process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000/api/v1";
        const { backendApi } = await import("@/lib/backend-api");
        const res = await backendApi.calendarEvents.list();
        assert.deepEqual(res, { items: [] });
        assert.equal(calls.length, 1);
        assert.match(calls[0]!.url, /\/calendar\/events$/);
        assert.equal(calls[0]!.init?.method, "GET");
    } finally {
        globalThis.fetch = prevFetch;
    }
});

test("backendApi.calendarEvents.create posts event payload to create endpoint", async () => {
    const prevFetch = globalThis.fetch;
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(url), init });
        return new Response(
            JSON.stringify({
                id: "evt-1",
                title: "Demo",
                start_time: "2026-01-14T10:00:00Z",
                end_time: "2026-01-14T10:30:00Z",
                status: "scheduled",
                lead_id: "lead-1",
                lead_name: "Ada Lovelace",
                notes: "<p>hi</p>",
                join_link: "https://example.test/join",
                calendar_link: "https://example.test/cal",
                participants: [{ name: "Ada Lovelace", email: "ada@example.test" }],
            }),
            { status: 200, headers: { "content-type": "application/json" } }
        );
    }) as typeof fetch;

    try {
        process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000/api/v1";
        const { backendApi } = await import("@/lib/backend-api");
        const created = await backendApi.calendarEvents.create({
            leadId: "lead-1",
            leadName: "Ada Lovelace",
            title: "Demo",
            startTime: "2026-01-14T10:00:00Z",
            endTime: "2026-01-14T10:30:00Z",
            notes: "<p>hi</p>",
        });
        assert.equal(created.id, "evt-1");
        assert.equal(created.startTime, "2026-01-14T10:00:00Z");
        assert.equal(created.endTime, "2026-01-14T10:30:00Z");
        assert.equal(created.leadId, "lead-1");
        assert.equal(created.leadName, "Ada Lovelace");
        assert.equal(created.joinLink, "https://example.test/join");
        assert.equal(created.calendarLink, "https://example.test/cal");

        assert.equal(calls.length, 1);
        assert.match(calls[0]!.url, /\/calendar\/events$/);
        assert.equal(calls[0]!.init?.method, "POST");
        const rawBody = calls[0]!.init?.body;
        assert.equal(typeof rawBody, "string");
        const body = JSON.parse(rawBody as string) as Record<string, unknown>;
        assert.equal(body.lead_id, "lead-1");
        assert.equal(body.lead_name, "Ada Lovelace");
        assert.equal(body.title, "Demo");
        assert.equal(body.start_time, "2026-01-14T10:00:00Z");
        assert.equal(body.end_time, "2026-01-14T10:30:00Z");
        assert.equal(body.notes, "<p>hi</p>");
    } finally {
        globalThis.fetch = prevFetch;
    }
});

test("backendApi.calendarEvents.cancel deletes event by id", async () => {
    const prevFetch = globalThis.fetch;
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(url), init });
        return new Response("", { status: 200, headers: { "content-type": "text/plain" } });
    }) as typeof fetch;

    try {
        process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000/api/v1";
        const { backendApi } = await import("@/lib/backend-api");
        await backendApi.calendarEvents.cancel("evt-9");
        assert.equal(calls.length, 1);
        assert.match(calls[0]!.url, /\/calendar\/events\/evt-9$/);
        assert.equal(calls[0]!.init?.method, "DELETE");
    } finally {
        globalThis.fetch = prevFetch;
    }
});
