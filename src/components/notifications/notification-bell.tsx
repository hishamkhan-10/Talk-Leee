"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationsState } from "@/lib/notifications-client";
import { NotificationCenterDrawer } from "@/components/notifications/notification-center-drawer";

export function NotificationBell({ className }: { className?: string }) {
    const { unreadCount } = useNotificationsState();
    const [open, setOpen] = useState(false);

    const badge = useMemo(() => {
        if (!unreadCount) return null;
        const text = unreadCount > 99 ? "99+" : String(unreadCount);
        return (
            <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                {text}
            </span>
        );
    }, [unreadCount]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn(
                    "relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20",
                    className
                )}
                aria-label="Open notification center"
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <Bell className="w-5 h-5" />
                {badge}
            </button>
            <NotificationCenterDrawer open={open} onOpenChange={setOpen} />
        </>
    );
}

