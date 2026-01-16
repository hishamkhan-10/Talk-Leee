"use client";

import { useMemo, useState } from "react";
import { Bell, CheckCheck, Circle, Filter, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/lib/notifications";
import { useNotificationsActions, useNotificationsState } from "@/lib/notifications-client";
import { Button } from "@/components/ui/button";

function formatTimestamp(ms: number) {
    return new Date(ms).toLocaleString();
}

const TYPE_LABEL: Record<NotificationType, string> = {
    success: "Success",
    warning: "Warning",
    error: "Error",
    info: "Info",
};

const TYPE_COLOR: Record<NotificationType, string> = {
    success: "text-emerald-500",
    warning: "text-amber-500",
    error: "text-red-500",
    info: "text-blue-500",
};

function NotificationRow({
    n,
    onMarkRead,
}: {
    n: AppNotification;
    onMarkRead: () => void;
}) {
    const unread = !n.readAt;
    return (
        <button
            type="button"
            onClick={onMarkRead}
            className={cn(
                "w-full rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
                unread ? "border-foreground/10 bg-foreground/5 hover:bg-foreground/7" : "border-border bg-background hover:bg-foreground/3"
            )}
            aria-label={unread ? "Mark notification as read" : "Notification"}
        >
            <div className="flex items-start gap-3">
                <div className={cn("mt-1 shrink-0", TYPE_COLOR[n.type])}>
                    {unread ? <Circle className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className={cn("text-sm", unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                                {n.title}
                            </div>
                            {n.message ? <div className="mt-0.5 text-sm text-muted-foreground">{n.message}</div> : null}
                        </div>
                        <div className="shrink-0 text-xs text-muted-foreground">{formatTimestamp(n.createdAt)}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={cn("font-semibold", TYPE_COLOR[n.type])}>{TYPE_LABEL[n.type]}</span>
                        <span aria-hidden>•</span>
                        <span className="font-medium capitalize">{n.priority}</span>
                        {n.readAt ? (
                            <>
                                <span aria-hidden>•</span>
                                <span>Read</span>
                            </>
                        ) : (
                            <>
                                <span aria-hidden>•</span>
                                <span>Unread</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}

function groupByType(items: AppNotification[]) {
    const groups: Record<NotificationType, AppNotification[]> = {
        success: [],
        warning: [],
        error: [],
        info: [],
    };
    for (const n of items) groups[n.type].push(n);
    return groups;
}

export function NotificationCenter({
    className,
    maxHeightClassName = "max-h-[70vh]",
}: {
    className?: string;
    maxHeightClassName?: string;
}) {
    const { notifications, unreadCount } = useNotificationsState();
    const { markRead, markAllRead, clearAll } = useNotificationsActions();
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [enabledTypes, setEnabledTypes] = useState<Record<NotificationType, boolean>>({
        success: true,
        warning: true,
        error: true,
        info: true,
    });

    const filtered = useMemo(() => {
        const byUnread = showUnreadOnly ? notifications.filter((n) => !n.readAt) : notifications;
        return byUnread.filter((n) => enabledTypes[n.type]);
    }, [enabledTypes, notifications, showUnreadOnly]);

    const groups = useMemo(() => groupByType(filtered), [filtered]);

    const orderedTypes: NotificationType[] = ["error", "warning", "success", "info"];

    return (
        <div className={cn("flex h-full flex-col", className)}>
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <div className="text-base font-semibold text-foreground">Notifications</div>
                        {unreadCount ? (
                            <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-semibold text-foreground">
                                {unreadCount} unread
                            </span>
                        ) : null}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">Grouped by type, newest first.</div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={markAllRead}
                        className="h-9"
                        aria-label="Mark all notifications as read"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all read
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearAll}
                        className="h-9"
                        aria-label="Clear notification history"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                <button
                    type="button"
                    onClick={() => setShowUnreadOnly((v) => !v)}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
                        showUnreadOnly ? "border-foreground/15 bg-foreground/5 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-foreground/3 hover:text-foreground"
                    )}
                    aria-pressed={showUnreadOnly}
                >
                    <Filter className="h-4 w-4" />
                    Unread only
                </button>
                {(Object.keys(enabledTypes) as NotificationType[]).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setEnabledTypes((prev) => ({ ...prev, [t]: !prev[t] }))}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
                            enabledTypes[t]
                                ? "border-foreground/15 bg-foreground/5 text-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-foreground/3 hover:text-foreground"
                        )}
                        aria-pressed={enabledTypes[t]}
                    >
                        <span className={cn("h-2.5 w-2.5 rounded-full", TYPE_COLOR[t].replace("text-", "bg-"))} aria-hidden />
                        {TYPE_LABEL[t]}
                    </button>
                ))}
            </div>

            <div className={cn("flex-1 overflow-y-auto px-4 py-4", maxHeightClassName)}>
                <div className="space-y-6">
                    {orderedTypes.map((type) => {
                        const items = groups[type];
                        if (!items.length) return null;
                        return (
                            <section key={type} aria-label={`${TYPE_LABEL[type]} notifications`} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={cn("h-2.5 w-2.5 rounded-full", TYPE_COLOR[type].replace("text-", "bg-"))} aria-hidden />
                                        <div className="text-sm font-semibold text-foreground">{TYPE_LABEL[type]}</div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">{items.length}</div>
                                </div>
                                <div className="space-y-2">
                                    {items.map((n) => (
                                        <NotificationRow key={n.id} n={n} onMarkRead={() => markRead(n.id)} />
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                    {filtered.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center">
                            <div className="text-sm font-semibold text-foreground">No notifications</div>
                            <div className="mt-1 text-sm text-muted-foreground">You’re all caught up.</div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

