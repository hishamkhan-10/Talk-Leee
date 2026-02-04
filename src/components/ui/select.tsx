"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function Select({
    value,
    onChange,
    children,
    className,
    selectClassName,
    ariaLabel,
    disabled,
}: {
    value: string;
    onChange: (next: string) => void;
    children: React.ReactNode;
    className?: string;
    selectClassName?: string;
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
                    "h-10 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm text-foreground shadow-sm transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:bg-accent/20 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-50",
                    selectClassName
                )}
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        </div>
    );
}
