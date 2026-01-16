"use client";

import { cn } from "@/lib/utils";

export function Switch({
    checked,
    onCheckedChange,
    ariaLabel,
    disabled,
    className,
}: {
    checked: boolean;
    onCheckedChange: (next: boolean) => void;
    ariaLabel: string;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full border border-gray-300 bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-gray-900 border-gray-900" : "",
                className
            )}
        >
            <span
                aria-hidden
                className={cn(
                    "inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform",
                    checked ? "translate-x-[1.375rem]" : ""
                )}
            />
        </button>
    );
}

