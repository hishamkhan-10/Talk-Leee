"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

type DrawerSide = "left" | "right" | "top" | "bottom";

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function ViewportDrawer({
    open,
    onOpenChange,
    side = "left",
    size = 320,
    margin = 10,
    showOverlay = true,
    overlayClassName,
    className,
    panelClassName,
    ariaLabel,
    children,
}: {
    open: boolean;
    onOpenChange: (next: boolean) => void;
    side?: DrawerSide;
    size?: number;
    margin?: number;
    showOverlay?: boolean;
    overlayClassName?: string;
    className?: string;
    panelClassName?: string;
    ariaLabel: string;
    children: React.ReactNode;
}) {
    const panelRef = useRef<HTMLElement | null>(null);
    const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

    useEffect(() => {
        if (!open) return;
        const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
        update();
        window.addEventListener("resize", update, { passive: true });
        return () => window.removeEventListener("resize", update);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onOpenChange]);

    const computed = useMemo(() => {
        const safeMargin = Math.max(10, margin);
        const w = viewport.w || 0;
        const h = viewport.h || 0;
        const maxW = Math.max(0, w - safeMargin * 2);
        const maxH = Math.max(0, h - safeMargin * 2);

        if (side === "left" || side === "right") {
            return {
                margin: safeMargin,
                width: clamp(size, 240, maxW),
                height: maxH,
            };
        }

        return {
            margin: safeMargin,
            width: maxW,
            height: clamp(size, 220, maxH),
        };
    }, [margin, side, size, viewport.h, viewport.w]);

    const panelStyle: React.CSSProperties =
        side === "left"
            ? { left: computed.margin, top: computed.margin, bottom: computed.margin, width: computed.width }
            : side === "right"
                ? { right: computed.margin, top: computed.margin, bottom: computed.margin, width: computed.width }
                : side === "top"
                    ? { left: computed.margin, right: computed.margin, top: computed.margin, height: computed.height }
                    : { left: computed.margin, right: computed.margin, bottom: computed.margin, height: computed.height };

    const initial =
        side === "left"
            ? { x: -24, opacity: 0 }
            : side === "right"
                ? { x: 24, opacity: 0 }
                : side === "top"
                    ? { y: -24, opacity: 0 }
                    : { y: 24, opacity: 0 };

    const animate =
        side === "left" || side === "right"
            ? { x: 0, opacity: 1 }
            : { y: 0, opacity: 1 };

    const exit = initial;

    return (
        <AnimatePresence>
            {open ? (
                <div className={cn("fixed inset-0 z-50", className)}>
                    {showOverlay ? (
                        <motion.button
                            type="button"
                            aria-label="Close drawer"
                            className={cn("absolute inset-0 bg-black/20 backdrop-blur-[2px]", overlayClassName)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => onOpenChange(false)}
                        />
                    ) : null}

                    <motion.aside
                        ref={(node) => {
                            panelRef.current = node;
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-label={ariaLabel}
                        className={cn(
                            "absolute overflow-hidden rounded-2xl border border-gray-200/60 bg-white/85 backdrop-blur-xl shadow-xl",
                            panelClassName
                        )}
                        style={panelStyle}
                        initial={initial}
                        animate={animate}
                        exit={exit}
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    >
                        <div className="h-full w-full overflow-y-auto overscroll-contain">{children}</div>
                    </motion.aside>
                </div>
            ) : null}
        </AnimatePresence>
    );
}

