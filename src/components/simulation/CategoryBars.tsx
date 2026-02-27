"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface CategoryEntry {
    transport: number;
    energy: number;
    diet: number;
    waste: number;
}

interface CategoryBarsProps {
    current?: CategoryEntry;
    previous?: CategoryEntry;
}

const CATEGORIES = [
    { key: "transport" as const, label: "Transport", emoji: "🚗", color: "#2D7D4A", bg: "#2D7D4A20" },
    { key: "energy" as const, label: "Energy", emoji: "⚡", color: "#6BAA75", bg: "#6BAA7520" },
    { key: "diet" as const, label: "Diet", emoji: "🥗", color: "#8B5A2B", bg: "#8B5A2B20" },
    { key: "waste" as const, label: "Waste", emoji: "♻️", color: "#4CD964", bg: "#4CD96420" },
];

function DeltaBadge({ current, prev }: { current: number; prev?: number }) {
    if (prev == null) return null;
    const delta = current - prev;
    const pct = prev !== 0 ? Math.abs((delta / prev) * 100).toFixed(0) : "—";
    const isDown = delta < 0;
    const isFlat = Math.abs(delta) < 0.01;
    if (isFlat) return <span className="text-[10px] text-muted-foreground ml-1">—</span>;
    return (
        <span className={`text-[10px] font-bold ml-1 ${isDown ? "text-[#4CD964]" : "text-rose-400"}`}>
            {isDown ? "▼" : "▲"} {pct}%
        </span>
    );
}

// Animated number component
function AnimatedNumber({ value }: { value: number }) {
    return (
        <motion.span key={value} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {value.toFixed(2)}
        </motion.span>
    );
}

export default function CategoryBars({ current, previous }: CategoryBarsProps) {
    const total = current ? Object.values(current).reduce((a, b) => a + b, 0) : 0;

    if (!current) {
        return (
            <div className="bg-card border border-border rounded-3xl p-5">
                <h3 className="font-bold text-sm mb-1">Category Breakdown</h3>
                <p className="text-xs text-muted-foreground">No data yet — submit a footprint to see your breakdown.</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">Category Breakdown</h3>
                <span className="text-xs text-muted-foreground">vs. previous submission</span>
            </div>
            <div className="space-y-3">
                {CATEGORIES.map(({ key, label, emoji, color, bg }) => {
                    const val = current[key] ?? 0;
                    const prev = previous?.[key];
                    const pct = total > 0 ? (val / total) * 100 : 0;

                    return (
                        <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm">{emoji}</span>
                                    <span className="text-xs font-medium">{label}</span>
                                    <DeltaBadge current={val} prev={prev} />
                                </div>
                                <span className="text-xs font-bold" style={{ color }}>
                                    <AnimatedNumber value={val} />t
                                </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: bg }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(pct, 100)}%` }}
                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
