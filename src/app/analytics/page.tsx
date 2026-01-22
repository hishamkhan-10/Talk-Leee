"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { extendedApi, CallSeriesItem } from "@/lib/extended-api";
import { BarChart2, TrendingUp, TrendingDown, Calendar, Activity, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { Select } from "@/components/ui/select";

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function GlassStatCard({
    title,
    value,
    icon: Icon,
    iconColor = "text-foreground",
    delay = 0,
}: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    iconColor?: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="rounded-2xl border border-border bg-background/70 backdrop-blur-sm p-4"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-muted/60 rounded-lg">
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-sm text-muted-foreground">{title}</p>
                </div>
            </div>
        </motion.div>
    );
}

export default function AnalyticsPage() {
    const [data, setData] = useState<CallSeriesItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
    const [dateRange, setDateRange] = useState(30);

    useEffect(() => {
        let cancelled = false;

        async function loadAnalytics() {
            try {
                setLoading(true);
                const toDate = new Date().toISOString().split("T")[0];
                const fromDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0];

                const response = await extendedApi.getCallAnalytics(fromDate, toDate, groupBy);
                if (cancelled) return;
                setData(response.series);
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : "Failed to load analytics");
            } finally {
                if (cancelled) return;
                setLoading(false);
            }
        }

        void loadAnalytics();

        return () => {
            cancelled = true;
        };
    }, [groupBy, dateRange]);

    const totals = data.reduce(
        (acc, item) => ({
            calls: acc.calls + item.total_calls,
            answered: acc.answered + item.answered,
            failed: acc.failed + item.failed,
        }),
        { calls: 0, answered: 0, failed: 0 }
    );

    const successRate = totals.calls > 0 ? Math.round((totals.answered / totals.calls) * 100) : 0;
    const maxCalls = Math.max(...data.map((d) => d.total_calls), 1);

    return (
        <DashboardLayout title="Analytics" description="Call performance over time">
            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:gap-4"
            >
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden />
                    <Select
                        value={String(dateRange)}
                        onChange={(v) => setDateRange(Number(v))}
                        ariaLabel="Select date range"
                        className="w-40"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Group by:</span>
                    <div className="flex rounded-lg overflow-hidden border border-border bg-background/70 backdrop-blur-sm">
                        {(["day", "week", "month"] as const).map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setGroupBy(g)}
                                className={`px-3 py-1.5 text-sm transition-colors ${groupBy === g
                                    ? "bg-foreground text-background"
                                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                                    }`}
                                aria-pressed={groupBy === g}
                            >
                                {g.charAt(0).toUpperCase() + g.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center h-64" role="status" aria-live="polite" aria-busy="true">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground/60" aria-hidden />
                    <span className="sr-only">Loading analytics…</span>
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600" role="alert" aria-live="assertive">
                    {error}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <GlassStatCard
                            title="Total Calls"
                            value={totals.calls}
                            icon={BarChart2}
                            delay={0}
                        />
                        <GlassStatCard
                            title="Answered"
                            value={totals.answered}
                            icon={TrendingUp}
                            iconColor="text-emerald-600"
                            delay={0.1}
                        />
                        <GlassStatCard
                            title="Failed"
                            value={totals.failed}
                            icon={TrendingDown}
                            iconColor="text-red-600"
                            delay={0.2}
                        />
                        <GlassStatCard
                            title="Success Rate"
                            value={`${successRate}%`}
                            icon={Percent}
                            delay={0.3}
                        />
                    </div>

                    {/* Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="rounded-2xl border border-border bg-background/70 backdrop-blur-sm p-4"
                    >
                        <h3 className="text-lg font-semibold text-foreground mb-6">Call Volume</h3>
                        {data.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden />
                                No data for the selected period
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Bar Chart */}
                                <div className="flex items-end gap-1 h-48">
                                    {data.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ scaleY: 0 }}
                                            animate={{ scaleY: 1 }}
                                            transition={{ delay: 0.5 + index * 0.02 }}
                                            className="flex-1 flex flex-col items-center gap-0.5 origin-bottom"
                                        >
                                            <div className="w-full flex flex-col gap-0.5">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{
                                                        height: `${(item.answered / maxCalls) * 160}px`
                                                    }}
                                                    transition={{ delay: 0.5 + index * 0.02, duration: 0.5 }}
                                                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t hover:from-emerald-500 hover:to-emerald-300 transition-colors cursor-pointer"
                                                    title={`Answered: ${item.answered}`}
                                                />
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{
                                                        height: `${(item.failed / maxCalls) * 160}px`
                                                    }}
                                                    transition={{ delay: 0.5 + index * 0.02, duration: 0.5 }}
                                                    className="w-full bg-gradient-to-b from-red-400 to-red-600 rounded-b hover:from-red-300 hover:to-red-500 transition-colors cursor-pointer"
                                                    title={`Failed: ${item.failed}`}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* X-axis labels */}
                                <div className="flex gap-1">
                                    {data.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex-1 text-center text-xs text-muted-foreground"
                                        >
                                            {formatDate(item.date)}
                                        </div>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/60">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded" />
                                        <span className="text-sm text-muted-foreground">Answered</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gradient-to-b from-red-400 to-red-600 rounded" />
                                        <span className="text-sm text-muted-foreground">Failed</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Data Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="rounded-2xl border border-border bg-background/70 backdrop-blur-sm p-4"
                    >
                        <h3 className="text-lg font-semibold text-foreground mb-4">Breakdown</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border/60">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                            Total
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                            Answered
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                            Failed
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                            Rate
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {data.map((item, index) => (
                                        <motion.tr
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.7 + index * 0.03 }}
                                            className="hover:bg-foreground/5 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{item.date}</td>
                                            <td className="px-4 py-3 text-sm text-right text-foreground font-semibold tabular-nums">{item.total_calls}</td>
                                            <td className="px-4 py-3 text-sm text-right text-emerald-600 tabular-nums">
                                                {item.answered}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-red-600 tabular-nums">
                                                {item.failed}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-foreground tabular-nums">
                                                {item.total_calls > 0
                                                    ? `${Math.round((item.answered / item.total_calls) * 100)}%`
                                                    : "--"}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            )}
        </DashboardLayout>
    );
}
