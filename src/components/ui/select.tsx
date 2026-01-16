"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function Select({
    value,
    onChange,
    children,
    className,
    ariaLabel,
    disabled,
}: {
    value: string;
    onChange: (next: string) => void;
    children: React.ReactNode;
    className?: string;
    ariaLabel: string;
    disabled?: boolean;
}) {
    return (
        <div className={cn("relative", className)}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={ariaLabel}
                disabled={disabled}
                className={cn(
                    "h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden />
        </div>
    );
}

