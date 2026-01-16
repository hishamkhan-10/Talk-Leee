"use client";

import type { CalendarEvent } from "@/lib/models";

function timeMs(iso: string | undefined) {
    if (!iso) return Number.NaN;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : Number.NaN;
}

export function splitAndSortMeetings(items: CalendarEvent[], nowMs: number = Date.now()) {
    const upcoming: CalendarEvent[] = [];
    const past: CalendarEvent[] = [];

    for (const m of items) {
        const start = timeMs(m.startTime);
        if (!Number.isFinite(start)) {
            upcoming.push(m);
            continue;
        }
        if (start >= nowMs) upcoming.push(m);
        else past.push(m);
    }

    upcoming.sort((a, b) => timeMs(a.startTime) - timeMs(b.startTime));
    past.sort((a, b) => timeMs(b.startTime) - timeMs(a.startTime));

    return { upcoming, past };
}

export function meetingLeadLabel(m: CalendarEvent) {
    if (m.leadName) return m.leadName;
    const p0 = m.participants?.[0];
    if (p0?.name) return p0.name;
    if (p0?.email) return p0.email;
    return "—";
}

export function meetingStatusLabel(m: CalendarEvent) {
    const s = (m.status ?? "scheduled").toLowerCase();
    if (s === "canceled" || s === "cancelled") return "Cancelled";
    if (s === "completed") return "Completed";
    if (s === "scheduled") return "Scheduled";
    if (s === "confirmed") return "Confirmed";
    return m.status ?? "Scheduled";
}

export function meetingStatusBadgeClass(m: CalendarEvent) {
    const s = (m.status ?? "scheduled").toLowerCase();
    if (s === "canceled" || s === "cancelled") return "bg-red-500/10 text-red-600 border border-red-500/20";
    if (s === "completed") return "bg-gray-500/10 text-gray-700 border border-gray-500/20";
    if (s === "confirmed") return "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20";
    return "bg-blue-500/10 text-blue-700 border border-blue-500/20";
}

export function formatMeetingDateTime(iso: string | undefined) {
    if (!iso) return "—";
    const ms = timeMs(iso);
    if (!Number.isFinite(ms)) return "—";
    return new Date(ms).toLocaleString();
}

