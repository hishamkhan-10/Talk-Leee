"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function stripScriptTags(html: string) {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

export function RichTextEditor({
    html,
    onChange,
    disabled,
    className,
}: {
    html: string;
    onChange: (nextHtml: string) => void;
    disabled?: boolean;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [focusTick, setFocusTick] = useState(0);

    const safeHtml = useMemo(() => stripScriptTags(html), [html]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (document.activeElement === el) return;
        if (el.innerHTML !== safeHtml) el.innerHTML = safeHtml;
    }, [safeHtml, focusTick]);

    const exec = (cmd: string, value?: string) => {
        if (disabled) return;
        ref.current?.focus();
        try {
            document.execCommand(cmd, false, value);
        } finally {
            setFocusTick((t) => t + 1);
            const next = ref.current?.innerHTML ?? "";
            onChange(stripScriptTags(next));
        }
    };

    const onInput = () => {
        const next = ref.current?.innerHTML ?? "";
        onChange(stripScriptTags(next));
    };

    return (
        <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-3", className)}>
            <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => exec("bold")}>
                    Bold
                </Button>
                <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => exec("italic")}>
                    Italic
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={disabled}
                    onClick={() => {
                        const url = window.prompt("Link URL");
                        if (!url) return;
                        exec("createLink", url);
                    }}
                >
                    Link
                </Button>
                <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => exec("unlink")}>
                    Unlink
                </Button>
            </div>

            <div
                ref={ref}
                className={cn(
                    "mt-3 min-h-[220px] w-full rounded-xl border border-white/10 bg-gray-950/40 px-3 py-2 text-sm text-white outline-none",
                    disabled ? "opacity-60" : "focus-visible:ring-2 focus-visible:ring-white/20"
                )}
                contentEditable={!disabled}
                suppressContentEditableWarning
                onInput={onInput}
                onBlur={() => setFocusTick((t) => t + 1)}
            />
        </div>
    );
}

