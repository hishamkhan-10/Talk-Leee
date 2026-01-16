"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Campaign } from "@/lib/dashboard-api";
import {
    eventCategoryIcon,
    EventQuickFilter,
    filterEvents,
    groupEventTime,
    StreamEvent,
} from "@/lib/campaign-performance";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type TimeGroup = "Today" | "Yesterday" | "Last 7 Days" | "Older";

function beep() {
    try {
        const WebkitAudioContext = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const AudioCtx = window.AudioContext ?? WebkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = 880;
        g.gain.value = 0.02;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        const t = window.setTimeout(() => {
            o.stop();
            ctx.close();
            window.clearTimeout(t);
        }, 120);
    } catch { }
}

function toLocalStorage<T>(key: string, value: T) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch { }
}

function fromLocalStorage<T>(key: string, fallback: T) {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function group(events: StreamEvent[]) {
    const out: Record<TimeGroup, StreamEvent[]> = { Today: [], Yesterday: [], "Last 7 Days": [], Older: [] };
    for (const e of events) {
        const g = groupEventTime(e.createdAt) as TimeGroup;
        out[g].push(e);
    }
    (Object.keys(out) as TimeGroup[]).forEach((k) => out[k].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
    return out;
}

export function EventStream({
    campaigns,
    initialEvents,
}: {
    campaigns: Campaign[];
    initialEvents?: StreamEvent[];
}) {
    const [events, setEvents] = useState<StreamEvent[]>(() => initialEvents || seedEvents(campaigns));
    const [quick, setQuick] = useState<EventQuickFilter>("All");
    const [sound, setSound] = useState(false);
    const [desktop, setDesktop] = useState(false);
    const [detailsId, setDetailsId] = useState<string | null>(null);
    const [lastId, setLastId] = useState<string | null>(null);

    useEffect(() => {
        const saved = fromLocalStorage<{ sound: boolean; desktop: boolean; quick: EventQuickFilter }>("campaigns.performance.eventPrefs", {
            sound: false,
            desktop: false,
            quick: "All",
        });
        const raf = window.requestAnimationFrame(() => {
            setSound(Boolean(saved.sound));
            setDesktop(Boolean(saved.desktop));
            setQuick(saved.quick || "All");
        });
        return () => window.cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        toLocalStorage("campaigns.performance.eventPrefs", { sound, desktop, quick });
    }, [desktop, quick, sound]);

    useEffect(() => {
        if (!desktop) return;
        if (!("Notification" in window)) return;
        if (Notification.permission === "granted") return;
        Notification.requestPermission().catch(() => { });
    }, [desktop]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            const next = generateEvent(campaigns);
            setEvents((prev) => [next, ...prev].slice(0, 120));
            setLastId(next.id);
            if (sound) beep();
            if (desktop && "Notification" in window && Notification.permission === "granted") {
                try {
                    new Notification(next.title, { body: next.description.slice(0, 140) });
                } catch { }
            }
        }, 9000);
        return () => window.clearInterval(interval);
    }, [campaigns, desktop, sound]);

    const filtered = useMemo(() => filterEvents(events, quick), [events, quick]);
    const grouped = useMemo(() => group(filtered), [filtered]);
    const details = useMemo(() => events.find((e) => e.id === detailsId) || null, [detailsId, events]);
    const relatedCampaigns = useMemo(() => {
        if (!details?.relatedCampaignIds || details.relatedCampaignIds.length === 0) return [];
        const set = new Set(details.relatedCampaignIds);
        return campaigns.filter((c) => set.has(c.id));
    }, [campaigns, details]);

    return (
        <div className="content-card">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="text-sm font-semibold text-white">Event Stream</div>
                    <div className="mt-1 text-sm text-gray-400">Realtime operational activity and system signals.</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {(["All", "Campaigns", "System", "Alerts", "User Actions"] as EventQuickFilter[]).map((k) => (
                        <Button
                            key={k}
                            type="button"
                            variant={quick === k ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setQuick(k)}
                        >
                            {k}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-sm font-semibold text-white">Sound notifications</div>
                    <input
                        type="checkbox"
                        checked={sound}
                        onChange={(e) => setSound(e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-white/5"
                    />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-sm font-semibold text-white">Desktop notifications</div>
                    <input
                        type="checkbox"
                        checked={desktop}
                        onChange={(e) => setDesktop(e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-white/5"
                    />
                </label>
            </div>

            <div className="mt-4 space-y-5">
                {(Object.keys(grouped) as TimeGroup[]).map((g) => (
                    <div key={g}>
                        <div className="text-xs font-semibold text-gray-300">{g}</div>
                        <div className="mt-2 space-y-2">
                            <AnimatePresence initial={false}>
                                {grouped[g].slice(0, 20).map((e) => (
                                        <motion.button
                                            key={e.id}
                                            type="button"
                                            className={cn(
                                                "flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                                                e.id === lastId ? "ring-1 ring-white/15" : ""
                                            )}
                                        initial={{ x: 18, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        onClick={() => setDetailsId(e.id)}
                                    >
                                        <div className="pt-0.5 text-lg">{eventCategoryIcon(e.category)}</div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="truncate text-sm font-semibold text-white">{e.title}</div>
                                                <div className="text-xs font-semibold text-gray-400 tabular-nums">
                                                    {new Date(e.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            </div>
                                            <div className="mt-1 line-clamp-2 text-sm text-gray-300">{e.description}</div>
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                open={detailsId !== null}
                onOpenChange={(next) => setDetailsId(next ? detailsId : null)}
                title={details ? details.title : "Event Details"}
                description={details ? `${details.category} • ${new Date(details.createdAt).toLocaleString()}` : undefined}
                size="lg"
            >
                {details ? (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="text-sm font-semibold text-white">Full description</div>
                            <div className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{details.description}</div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="text-sm font-semibold text-white">Related campaigns</div>
                                <div className="mt-2 space-y-2">
                                    {relatedCampaigns.length === 0 ? (
                                        <div className="text-sm text-gray-400">—</div>
                                    ) : (
                                        relatedCampaigns.map((c) => (
                                            <div key={c.id} className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-white">{c.name}</div>
                                                    <div className="truncate text-xs font-semibold text-gray-400">{c.id}</div>
                                                </div>
                                                <Button type="button" variant="outline" size="sm" asChild>
                                                    <a href={`/campaigns/${c.id}`}>Open</a>
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="text-sm font-semibold text-white">Metadata</div>
                                <div className="mt-2 space-y-2">
                                    {details.metadata && Object.keys(details.metadata).length > 0 ? (
                                        Object.entries(details.metadata).map(([k, v]) => (
                                            <div key={k} className="flex items-center justify-between gap-3">
                                                <div className="text-sm text-gray-300">{k}</div>
                                                <div className="text-sm font-semibold text-white tabular-nums">{String(v)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-400">—</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="text-sm font-semibold text-white">Action history</div>
                            <div className="mt-2 space-y-2 text-sm text-gray-300">
                                <div>Created • {new Date(details.createdAt).toLocaleString()}</div>
                                <div>Viewed • {new Date().toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}

function seedEvents(campaigns: Campaign[]): StreamEvent[] {
    const now = Date.now();
    const pick = (idx: number) => campaigns[idx % Math.max(1, campaigns.length)]?.id;
    return [
        {
            id: `evt-${now - 1000}`,
            category: "Campaign",
            title: "Campaign started",
            description: "Holiday Sales Outreach began processing new leads.",
            createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
            relatedCampaignIds: pick(0) ? [pick(0)!] : [],
            metadata: { queueDepth: 42, operator: "scheduler" },
        },
        {
            id: `evt-${now - 2000}`,
            category: "System",
            title: "Worker pool scaled",
            description: "System scaled worker pool from 6 → 10 to handle traffic spike.",
            createdAt: new Date(now - 1000 * 60 * 80).toISOString(),
            metadata: { from: 6, to: 10 },
        },
        {
            id: `evt-${now - 3000}`,
            category: "Alerts",
            title: "Retry rate elevated",
            description: "Outbound retry rate exceeded threshold for 5 minutes.",
            createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
            metadata: { rate: "7.2%", threshold: "5.0%" },
        },
        {
            id: `evt-${now - 4000}`,
            category: "User Actions",
            title: "Campaign paused",
            description: "Operator paused Customer Satisfaction Survey for script review.",
            createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
            relatedCampaignIds: pick(1) ? [pick(1)!] : [],
            metadata: { user: "Alex" },
        },
        {
            id: `evt-${now - 5000}`,
            category: "Milestones",
            title: "Goal reached",
            description: "Appointment Reminders hit 95% completion milestone.",
            createdAt: new Date(now - 1000 * 60 * 60 * 24 * 9).toISOString(),
            relatedCampaignIds: pick(2) ? [pick(2)!] : [],
            metadata: { completion: "95%" },
        },
    ];
}

function generateEvent(campaigns: Campaign[]): StreamEvent {
    const now = Date.now();
    const roll = now % 5;
    const c = campaigns.length > 0 ? campaigns[now % campaigns.length] : null;
    if (roll === 0) {
        return {
            id: `evt-${now}`,
            category: "Campaign",
            title: "Campaign progress updated",
            description: `${c?.name || "A campaign"} processed a new batch of calls.`,
            createdAt: new Date(now).toISOString(),
            relatedCampaignIds: c ? [c.id] : [],
            metadata: { processed: 25, window: "5m" },
        };
    }
    if (roll === 1) {
        return {
            id: `evt-${now}`,
            category: "System",
            title: "API latency normalizing",
            description: "System observed latency returning to baseline after brief spike.",
            createdAt: new Date(now).toISOString(),
            metadata: { p95: "210ms", baseline: "160ms" },
        };
    }
    if (roll === 2) {
        return {
            id: `evt-${now}`,
            category: "Alerts",
            title: "Carrier errors detected",
            description: "Carrier error codes increased on outbound calls, retry policy engaged.",
            createdAt: new Date(now).toISOString(),
            relatedCampaignIds: c ? [c.id] : [],
            metadata: { code: "486", retries: "enabled" },
        };
    }
    if (roll === 3) {
        return {
            id: `evt-${now}`,
            category: "User Actions",
            title: "Settings updated",
            description: "Operator updated campaign script and concurrency settings.",
            createdAt: new Date(now).toISOString(),
            relatedCampaignIds: c ? [c.id] : [],
            metadata: { user: "Operator", field: "concurrency" },
        };
    }
    return {
        id: `evt-${now}`,
        category: "Milestones",
        title: "Completion milestone",
        description: `${c?.name || "A campaign"} reached a progress milestone.`,
        createdAt: new Date(now).toISOString(),
        relatedCampaignIds: c ? [c.id] : [],
        metadata: { milestone: "70%" },
    };
}
