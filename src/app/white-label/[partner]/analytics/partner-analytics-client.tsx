"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { HoverTooltip, useHoverTooltip } from "@/components/ui/hover-tooltip";

type MinutesBySubTenant = {
    subTenant: string;
    minutesUsed: number;
};

type ConcurrencyPoint = {
    time: string;
    concurrentCalls: number;
};

type DailyUsagePoint = {
    date: string;
    minutes: number;
};

function stableNumberFromString(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function toSmoothPath(points: Array<{ x: number; y: number }>, smoothing = 0.18) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;

    const cps = (current: { x: number; y: number }, previous: { x: number; y: number }, next: { x: number; y: number }) => {
        const dx = next.x - previous.x;
        return { x: current.x - dx * smoothing, y: current.y };
    };

    const cpe = (current: { x: number; y: number }, previous: { x: number; y: number }, next: { x: number; y: number }) => {
        const dx = next.x - previous.x;
        return { x: current.x + dx * smoothing, y: current.y };
    };

    let d = `M ${points[0]!.x} ${points[0]!.y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i]!;
        const p1 = points[i]!;
        const p2 = points[i + 1]!;
        const p3 = points[i + 2] ?? p2;
        const start = cpe(p1, p0, p2);
        const end = cps(p2, p1, p3);
        d += ` C ${start.x} ${start.y}, ${end.x} ${end.y}, ${p2.x} ${p2.y}`;
    }
    return d;
}

function formatShortDate(isoDate: string) {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function makeMockData(partnerId: string): {
    minutesBySubTenant: MinutesBySubTenant[];
    concurrencyPeaks: ConcurrencyPoint[];
    dailyUsage: DailyUsagePoint[];
} {
    const key = partnerId.trim().toLowerCase();

    if (key === "acme") {
        const today = new Date();
        const dailyUsage = Array.from({ length: 14 }).map((_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (13 - i));
            const base = [320, 410, 290, 530][i % 4] ?? 380;
            const minutes = base + Math.round(((i % 5) - 2) * 18);
            return { date: d.toISOString().slice(0, 10), minutes: Math.max(0, minutes) };
        });

        return {
            minutesBySubTenant: [
                { subTenant: "Salon Assistant", minutesUsed: 600 },
                { subTenant: "Clinic Bot", minutesUsed: 1200 },
                { subTenant: "Restaurant Bot", minutesUsed: 350 },
            ],
            concurrencyPeaks: [
                { time: "10:00", concurrentCalls: 3 },
                { time: "11:00", concurrentCalls: 6 },
                { time: "12:00", concurrentCalls: 8 },
                { time: "13:00", concurrentCalls: 4 },
            ],
            dailyUsage,
        };
    }

    const seed = stableNumberFromString(key);
    const tenantsCount = 4 + (seed % 6);
    const minutesBySubTenant = Array.from({ length: tenantsCount }).map((_, i) => {
        const minutesUsed = 180 + ((seed + i * 97) % 1700);
        return { subTenant: `Sub-Tenant ${i + 1}`, minutesUsed };
    });

    const concurrencyPoints = 8 + (seed % 5);
    const startHour = 9 + (seed % 3);
    const concurrencyPeaks = Array.from({ length: concurrencyPoints }).map((_, i) => {
        const hour = startHour + i;
        const time = `${String(hour).padStart(2, "0")}:00`;
        const wave = Math.sin((i / Math.max(1, concurrencyPoints - 1)) * Math.PI);
        const noise = ((seed + i * 43) % 5) - 2;
        const concurrentCalls = Math.max(0, Math.round(2 + wave * (6 + (seed % 5)) + noise));
        return { time, concurrentCalls };
    });

    const today = new Date();
    const days = 14;
    const dailyUsage = Array.from({ length: days }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (days - 1 - i));
        const base = 220 + ((seed + i * 41) % 560);
        const drift = Math.round(((i - (days - 1) / 2) / days) * (seed % 180));
        const minutes = Math.max(0, base + drift);
        return { date: d.toISOString().slice(0, 10), minutes };
    });

    return { minutesBySubTenant, concurrencyPeaks, dailyUsage };
}

const BAR_COLORS = [
    { solid: "#6366f1", light: "#a5b4fc", gradient0: "rgba(99,102,241,0.92)", gradient1: "rgba(99,102,241,0.55)" },
    { solid: "#06b6d4", light: "#67e8f9", gradient0: "rgba(6,182,212,0.92)", gradient1: "rgba(6,182,212,0.55)" },
    { solid: "#8b5cf6", light: "#c4b5fd", gradient0: "rgba(139,92,246,0.92)", gradient1: "rgba(139,92,246,0.55)" },
    { solid: "#14b8a6", light: "#5eead4", gradient0: "rgba(20,184,166,0.92)", gradient1: "rgba(20,184,166,0.55)" },
    { solid: "#f59e0b", light: "#fcd34d", gradient0: "rgba(245,158,11,0.92)", gradient1: "rgba(245,158,11,0.55)" },
    { solid: "#ec4899", light: "#f9a8d4", gradient0: "rgba(236,72,153,0.92)", gradient1: "rgba(236,72,153,0.55)" },
    { solid: "#3b82f6", light: "#93c5fd", gradient0: "rgba(59,130,246,0.92)", gradient1: "rgba(59,130,246,0.55)" },
];

function BarChart({
    title,
    subtitle,
    yLabel,
    items,
}: {
    title: string;
    subtitle: string;
    yLabel: string;
    items: Array<{ label: string; value: number }>;
}) {
    const tooltip = useHoverTooltip();
    const maxValue = Math.max(1, ...items.map((x) => x.value));
    const total = items.reduce((acc, x) => acc + x.value, 0);
    const avg = items.length > 0 ? Math.round(total / items.length) : 0;

    const height = 280;
    const top = 24;
    const bottom = 62;
    const left = 68;
    const right = 24;
    const barW = 52;
    const gap = 28;
    const plotH = height - top - bottom;
    const plotW = items.length * barW + Math.max(0, items.length - 1) * gap;
    const width = Math.max(560, left + right + plotW);

    const ticks = 4;
    const yTicks = Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = Math.round((i * maxValue) / ticks);
        return v;
    });

    const niceLabel = (label: string) => label.length > 13 ? `${label.slice(0, 11)}…` : label;

    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-gray-700/60 dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-semibold text-foreground">{title}</div>
                    <div className="text-xs text-muted-foreground">{subtitle}</div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    <span>Total: <span className="font-semibold text-foreground">{total.toLocaleString()}</span></span>
                    <span>Avg: <span className="font-semibold text-foreground">{avg.toLocaleString()}</span></span>
                </div>
            </div>

            <div className="mt-4 relative">
                <HoverTooltip tooltip={tooltip} />
                <div className="overflow-x-auto">
                    <svg width={width} height={height} className="min-w-full">
                        <defs>
                            {BAR_COLORS.map((c, i) => (
                                <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={c.gradient0} />
                                    <stop offset="100%" stopColor={c.gradient1} />
                                </linearGradient>
                            ))}
                            <filter id="barShadow" x="-10%" y="-5%" width="120%" height="115%">
                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.08)" />
                            </filter>
                        </defs>

                        {yTicks.map((t) => {
                            const y = top + plotH - (t / maxValue) * plotH;
                            return (
                                <g key={t}>
                                    <line
                                        x1={left}
                                        x2={width - right}
                                        y1={y}
                                        y2={y}
                                        className="chart-grid-line"
                                        strokeWidth={0.8}
                                        strokeDasharray={t === 0 ? undefined : "3 5"}
                                    />
                                    <text
                                        x={left - 10}
                                        y={y + 4}
                                        textAnchor="end"
                                        className="chart-axis-text"
                                        style={{ fontSize: 10.5, fontWeight: 500 }}
                                    >
                                        {t.toLocaleString()}
                                    </text>
                                </g>
                            );
                        })}

                        <text
                            x={14}
                            y={top + plotH / 2}
                            transform={`rotate(-90 14 ${top + plotH / 2})`}
                            className="chart-axis-label"
                            style={{ fontSize: 10, fontWeight: 600 }}
                        >
                            {yLabel}
                        </text>

                        {items.map((item, i) => {
                            const color = BAR_COLORS[i % BAR_COLORS.length]!;
                            const x = left + i * (barW + gap);
                            const h = Math.max(4, (item.value / maxValue) * plotH);
                            const y = top + plotH - h;
                            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;

                            const content = (
                                <div className="space-y-1.5">
                                    <div className="text-xs font-bold" style={{ color: color.solid }}>{item.label}</div>
                                    <div className="flex items-center justify-between gap-8 text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">{yLabel}</span>
                                        <span className="tabular-nums font-bold text-gray-900 dark:text-gray-100">{item.value.toLocaleString()}</span>
                                    </div>
                                    <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{pct}% of total</div>
                                </div>
                            );

                            return (
                                <g
                                    key={item.label}
                                    onMouseEnter={(e) => tooltip.show(e.clientX, e.clientY, content)}
                                    onMouseMove={(e) => tooltip.show(e.clientX, e.clientY, content)}
                                    onMouseLeave={() => tooltip.hide()}
                                    onPointerDown={(e) => {
                                        if (e.pointerType === "touch") tooltip.show(e.clientX, e.clientY, content, { pinned: true, autoHideMs: 2500 });
                                    }}
                                    tabIndex={0}
                                    role="img"
                                    aria-label={`${item.label}: ${item.value} minutes`}
                                    onFocus={(e) => {
                                        const rect = (e.currentTarget as unknown as SVGGElement).getBoundingClientRect();
                                        tooltip.show(rect.left + rect.width / 2, rect.top + rect.height / 2, content);
                                    }}
                                    onBlur={() => tooltip.hide()}
                                    className="cursor-default"
                                >
                                    <rect x={x} y={y} width={barW} height={h} rx={8} fill={`url(#barGrad-${i % BAR_COLORS.length})`} filter="url(#barShadow)" />
                                    <text
                                        x={x + barW / 2}
                                        y={y - 8}
                                        textAnchor="middle"
                                        style={{ fontSize: 10, fontWeight: 700, fill: color.solid }}
                                    >
                                        {item.value.toLocaleString()}
                                    </text>
                                    <text
                                        x={x + barW / 2}
                                        y={top + plotH + 18}
                                        textAnchor="middle"
                                        className="chart-axis-text"
                                        style={{ fontSize: 10.5, fontWeight: 600 }}
                                    >
                                        {niceLabel(item.label)}
                                    </text>
                                    <text
                                        x={x + barW / 2}
                                        y={top + plotH + 32}
                                        textAnchor="middle"
                                        style={{ fontSize: 9, fontWeight: 500, fill: color.solid }}
                                    >
                                        {pct}%
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
}

function LineChart({
    title,
    subtitle,
    xLabel,
    yLabel,
    points,
    highlightMax = true,
    lineColor = "#6366f1",
    accentColor = "#a5b4fc",
    areaFrom = "rgba(99,102,241,0.18)",
    areaTo = "rgba(99,102,241,0.01)",
}: {
    title: string;
    subtitle: string;
    xLabel: string;
    yLabel: string;
    points: Array<{ label: string; value: number }>;
    highlightMax?: boolean;
    lineColor?: string;
    accentColor?: string;
    areaFrom?: string;
    areaTo?: string;
}) {
    const tooltip = useHoverTooltip();

    const height = 280;
    const top = 24;
    const bottom = 58;
    const left = 68;
    const right = 24;
    const plotH = height - top - bottom;

    const values = points.map((p) => p.value);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 1);
    const range = Math.max(1, maxVal - minVal);
    const avg = points.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

    const spacing = points.length > 10 ? 52 : 72;
    const width = Math.max(560, left + right + Math.max(0, points.length - 1) * spacing);
    const plotW = width - left - right;

    const maxIdx = points.length > 0 ? values.indexOf(maxVal) : -1;
    const minIdx = points.length > 0 ? values.indexOf(Math.min(...values)) : -1;

    const xFor = (i: number) => {
        if (points.length <= 1) return left + plotW / 2;
        return left + (i * plotW) / (points.length - 1);
    };

    const yFor = (v: number) => {
        const t = (v - minVal) / range;
        return top + (1 - clamp(t, 0, 1)) * plotH;
    };

    const chartPoints = points.map((p, i) => ({ x: xFor(i), y: yFor(p.value) }));
    const d = toSmoothPath(chartPoints);
    const areaD =
        chartPoints.length > 0
            ? `${d} L ${chartPoints[chartPoints.length - 1]!.x} ${top + plotH} L ${chartPoints[0]!.x} ${top + plotH} Z`
            : "";

    const ticks = 4;
    const yTicks = Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = minVal + (i * range) / ticks;
        return Math.round(v);
    });

    const xTickStep = Math.max(1, Math.ceil(points.length / 8));
    const xTickIdxs = Array.from({ length: Math.ceil(points.length / xTickStep) }).map((_, i) => Math.min(i * xTickStep, points.length - 1));
    if (xTickIdxs.length > 0 && xTickIdxs[xTickIdxs.length - 1] !== points.length - 1) xTickIdxs.push(points.length - 1);

    const gradId = `areaGrad-${title.replace(/\s/g, "")}`;

    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-gray-700/60 dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-semibold text-foreground">{title}</div>
                    <div className="text-xs text-muted-foreground">{subtitle}</div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    <span>Peak: <span className="font-semibold text-foreground">{maxVal.toLocaleString()}</span></span>
                    <span>Avg: <span className="font-semibold text-foreground">{avg.toLocaleString()}</span></span>
                    {highlightMax && minVal > 0 && (
                        <span>Low: <span className="font-semibold text-foreground">{Math.min(...values).toLocaleString()}</span></span>
                    )}
                </div>
            </div>

            <div className="mt-4 relative">
                <HoverTooltip tooltip={tooltip} />
                <div className="overflow-x-auto">
                    <svg width={width} height={height} className="min-w-full">
                        <defs>
                            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={areaFrom} />
                                <stop offset="100%" stopColor={areaTo} />
                            </linearGradient>
                            <filter id={`glow-${title.replace(/\s/g, "")}`}>
                                <feGaussianBlur stdDeviation="2.5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {yTicks.map((t) => {
                            const y = yFor(t);
                            return (
                                <g key={t}>
                                    <line
                                        x1={left}
                                        x2={width - right}
                                        y1={y}
                                        y2={y}
                                        className="chart-grid-line"
                                        strokeWidth={0.8}
                                        strokeDasharray={t === minVal ? undefined : "3 5"}
                                    />
                                    <text
                                        x={left - 10}
                                        y={y + 4}
                                        textAnchor="end"
                                        className="chart-axis-text"
                                        style={{ fontSize: 10.5, fontWeight: 500 }}
                                    >
                                        {t.toLocaleString()}
                                    </text>
                                </g>
                            );
                        })}

                        {highlightMax && (
                            <line
                                x1={left}
                                x2={width - right}
                                y1={yFor(avg)}
                                y2={yFor(avg)}
                                stroke={lineColor}
                                strokeWidth={0.8}
                                strokeDasharray="6 4"
                                opacity={0.4}
                            />
                        )}

                        <text
                            x={14}
                            y={top + plotH / 2}
                            transform={`rotate(-90 14 ${top + plotH / 2})`}
                            className="chart-axis-label"
                            style={{ fontSize: 10, fontWeight: 600 }}
                        >
                            {yLabel}
                        </text>

                        <path d={areaD} fill={`url(#${gradId})`} />
                        <path
                            d={d}
                            fill="none"
                            stroke={lineColor}
                            strokeWidth={2.5}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            filter={`url(#glow-${title.replace(/\s/g, "")})`}
                        />

                        {chartPoints.map((pt, i) => {
                            const p = points[i]!;
                            const isMax = highlightMax && i === maxIdx;
                            const isMin = highlightMax && i === minIdx && minIdx !== maxIdx;

                            const content = (
                                <div className="space-y-1.5">
                                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{p.label}</div>
                                    <div className="flex items-center justify-between gap-8 text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">{yLabel}</span>
                                        <span className="tabular-nums font-bold text-gray-900 dark:text-gray-100">{p.value.toLocaleString()}</span>
                                    </div>
                                    {isMax && <div className="text-[10px] font-semibold" style={{ color: lineColor }}>Peak</div>}
                                    {isMin && <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">Lowest</div>}
                                </div>
                            );

                            return (
                                <g
                                    key={`${p.label}-${i}`}
                                    onMouseEnter={(e) => tooltip.show(e.clientX, e.clientY, content)}
                                    onMouseMove={(e) => tooltip.show(e.clientX, e.clientY, content)}
                                    onMouseLeave={() => tooltip.hide()}
                                    onPointerDown={(e) => {
                                        if (e.pointerType === "touch") tooltip.show(e.clientX, e.clientY, content, { pinned: true, autoHideMs: 2500 });
                                    }}
                                    tabIndex={0}
                                    role="img"
                                    aria-label={`${p.label}: ${p.value}`}
                                    onFocus={(e) => {
                                        const rect = (e.currentTarget as unknown as SVGGElement).getBoundingClientRect();
                                        tooltip.show(rect.left + rect.width / 2, rect.top + rect.height / 2, content);
                                    }}
                                    onBlur={() => tooltip.hide()}
                                    className="cursor-default"
                                >
                                    {isMax && (
                                        <circle cx={pt.x} cy={pt.y} r={12} fill={lineColor} opacity={0.1} />
                                    )}
                                    <motion.circle
                                        initial={{ r: 0 }}
                                        animate={{ r: isMax ? 5.5 : isMin ? 4.5 : 3.5 }}
                                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 + i * 0.025 }}
                                        cx={pt.x}
                                        cy={pt.y}
                                        fill={isMax ? lineColor : isMin ? accentColor : "hsl(var(--card))"}
                                        stroke={isMax ? lineColor : isMin ? accentColor : lineColor}
                                        strokeWidth={isMax ? 2 : 1.8}
                                    />
                                </g>
                            );
                        })}

                        {xTickIdxs.map((i) => {
                            const showLabel = points.length <= 14 || i % 2 === 0 || i === points.length - 1;
                            return (
                                <text
                                    key={`x-${i}`}
                                    x={xFor(i)}
                                    y={top + plotH + 18}
                                    textAnchor="middle"
                                    className="chart-axis-text"
                                    style={{ fontSize: showLabel ? 10 : 9, fontWeight: showLabel ? 600 : 400 }}
                                >
                                    {points[i]?.label ?? ""}
                                </text>
                            );
                        })}

                        <text
                            x={left + plotW / 2}
                            y={height - 10}
                            textAnchor="middle"
                            className="chart-axis-label"
                            style={{ fontSize: 10, fontWeight: 600 }}
                        >
                            {xLabel}
                        </text>
                    </svg>
                </div>
            </div>
        </div>
    );
}

export function PartnerAnalyticsClient({ partnerId }: { partnerId: string }) {
    const data = useMemo(() => makeMockData(partnerId), [partnerId]);

    const minutesItems = useMemo(() => {
        return data.minutesBySubTenant.map((x) => ({ label: x.subTenant, value: x.minutesUsed }));
    }, [data.minutesBySubTenant]);

    const concurrencyItems = useMemo(() => {
        return data.concurrencyPeaks.map((x) => ({ label: x.time, value: x.concurrentCalls }));
    }, [data.concurrencyPeaks]);

    const dailyItems = useMemo(() => {
        return data.dailyUsage.map((x) => ({ label: formatShortDate(x.date), value: x.minutes }));
    }, [data.dailyUsage]);

    return (
        <div className="space-y-6">
            <BarChart
                title="Minutes Per Sub-Tenant"
                subtitle="Total minutes consumed by each sub-tenant (aggregated)."
                yLabel="Minutes"
                items={minutesItems}
            />

            <LineChart
                title="Concurrent Usage Peaks"
                subtitle="Peak concurrent call usage over time (aggregated)."
                xLabel="Time"
                yLabel="Concurrent calls"
                points={concurrencyItems}
                highlightMax
                lineColor="#14b8a6"
                accentColor="#5eead4"
                areaFrom="rgba(20,184,166,0.18)"
                areaTo="rgba(20,184,166,0.01)"
            />

            <LineChart
                title="Daily Usage Trends"
                subtitle="Total minutes consumed per day (aggregated)."
                xLabel="Date"
                yLabel="Minutes"
                points={dailyItems}
                highlightMax={false}
                lineColor="#6366f1"
                accentColor="#a5b4fc"
                areaFrom="rgba(99,102,241,0.18)"
                areaTo="rgba(99,102,241,0.01)"
            />
        </div>
    );
}
