"use client";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Leaf, Activity, Sparkles } from "lucide-react";

interface HistoryEntry {
    total: number;
    timestamp?: string;
}

interface LiveStatsProps {
    history: HistoryEntry[];
    /** Projected savings from active strategies (tCO₂e/yr) */
    projectedSavings?: number;
}

function AnimatedValue({ value, suffix = "" }: { value: string | number; suffix?: string }) {
    return (
        <motion.span
            key={String(value)}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-black text-2xl leading-none"
        >
            {value}{suffix}
        </motion.span>
    );
}

function TrendIcon({ delta }: { delta: number }) {
    if (Math.abs(delta) < 0.01) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (delta < 0) return <TrendingDown className="w-4 h-4 text-[#4CD964]" />;
    return <TrendingUp className="w-4 h-4 text-rose-400" />;
}

export default function LiveStats({ history, projectedSavings = 0 }: LiveStatsProps) {
    // history is newest-first
    const latest = history[0];
    const prev = history[1];

    const currentTotal = latest?.total ?? null;
    const delta = (latest && prev) ? latest.total - prev.total : null;
    const deltaPct = (delta != null && prev && prev.total !== 0)
        ? ((delta / prev.total) * 100)
        : null;

    const projSaved = projectedSavings > 0 && currentTotal != null
        ? Math.max(currentTotal - projectedSavings, 0)
        : null;

    const cards = [
        {
            icon: <Activity className="w-4 h-4" />,
            label: "Current Total",
            color: "#4CD964",
            bg: "#4CD96415",
            border: "#4CD96430",
            value:
                currentTotal != null ? (
                    <div className="flex items-end gap-1">
                        <AnimatedValue value={currentTotal.toFixed(2)} />
                        <span className="text-sm font-medium text-muted-foreground mb-0.5">tCO₂e</span>
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">No data yet</span>
                ),
            sub:
                delta != null ? (
                    <div className="flex items-center gap-1 text-xs">
                        <TrendIcon delta={delta} />
                        <span className={delta < 0 ? "text-[#4CD964]" : "text-rose-400"}>
                            {Math.abs(delta).toFixed(2)}t ({Math.abs(deltaPct ?? 0).toFixed(0)}%)
                        </span>
                        <span className="text-muted-foreground">vs last</span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">First submission</span>
                ),
        },
        {
            icon: <TrendingDown className="w-4 h-4" />,
            label: "Change from Previous",
            color: delta != null && delta < 0 ? "#4CD964" : "#f59e0b",
            bg: delta != null && delta < 0 ? "#4CD96415" : "#f59e0b15",
            border: delta != null && delta < 0 ? "#4CD96430" : "#f59e0b30",
            value:
                deltaPct != null ? (
                    <div className="flex items-end gap-1">
                        <AnimatedValue value={`${delta! < 0 ? "−" : "+"}${Math.abs(deltaPct).toFixed(1)}`} suffix="%" />
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                ),
            sub:
                delta != null ? (
                    <span className="text-xs text-muted-foreground">
                        {delta < 0 ? "Great progress! 🌿" : "Higher than last time"}
                    </span>
                ) : (
                    <span className="text-xs text-muted-foreground">Submit again to compare</span>
                ),
        },
        {
            icon: <Sparkles className="w-4 h-4" />,
            label: "Projected with Strategies",
            color: "#6BAA75",
            bg: "#6BAA7515",
            border: "#6BAA7530",
            value:
                projSaved != null ? (
                    <div className="flex items-end gap-1">
                        <AnimatedValue value={projSaved.toFixed(2)} />
                        <span className="text-sm font-medium text-muted-foreground mb-0.5">t/yr</span>
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">
                        {currentTotal == null ? "No data" : "Select strategies →"}
                    </span>
                ),
            sub:
                projSaved != null ? (
                    <div className="flex items-center gap-1 text-xs text-[#4CD964]">
                        <Leaf className="w-3 h-3" />
                        <span>Save {projectedSavings.toFixed(2)}t with active strategies</span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">Toggle strategies above</span>
                ),
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cards.map(({ icon, label, color, bg, border, value, sub }) => (
                <motion.div
                    key={label}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="rounded-2xl p-4 border"
                    style={{ backgroundColor: bg, borderColor: border }}
                >
                    <div className="flex items-center gap-1.5 mb-3" style={{ color }}>
                        {icon}
                        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                    </div>
                    <div style={{ color }}>{value}</div>
                    <div className="mt-2">{sub}</div>
                </motion.div>
            ))}
        </div>
    );
}
