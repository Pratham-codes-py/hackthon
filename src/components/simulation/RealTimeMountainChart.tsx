"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Dot
} from "recharts";
import { db } from "@/lib/firebase/config";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

interface HistoryEntry {
    total: number;
    transport?: number;
    energy?: number;
    diet?: number;
    waste?: number;
    timestamp?: string;
    createdAt?: Date;
    userId?: string;
}

interface ChartPoint {
    label: string;
    value: number;
    isLast?: boolean;
}

// Custom dot that only renders the leading (last) point with a glow ring
function LeadingDot(props: any) {
    const { cx, cy, index, dataLength } = props;
    if (index !== dataLength - 1) return null;
    return (
        <g>
            {/* Outer pulse ring */}
            <circle cx={cx} cy={cy} r={12} fill="#4CD96440" className="animate-ping" />
            {/* Middle ring */}
            <circle cx={cx} cy={cy} r={8} fill="none" stroke="#4CD964" strokeWidth={2.5} />
            {/* White core */}
            <circle cx={cx} cy={cy} r={4} fill="white" />
        </g>
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
                <p className="text-muted-foreground mb-1">{label}</p>
                <p className="font-black text-[#4CD964]">{payload[0]?.value?.toFixed(2)} tCO₂e</p>
            </div>
        );
    }
    return null;
}

function formatLabel(timestamp: string | undefined, index: number): string {
    if (!timestamp) return `#${index + 1}`;
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type Range = 10 | 30 | 9999;

interface RealTimeMountainChartProps {
    /** Footprint entries from localStorage (parent passes these in) */
    history: HistoryEntry[];
    userId?: string;
}

export default function RealTimeMountainChart({ history: localHistory, userId }: RealTimeMountainChartProps) {
    const [history, setHistory] = useState<HistoryEntry[]>(localHistory);
    const [range, setRange] = useState<Range>(30);
    const [justUpdated, setJustUpdated] = useState(false);
    const prevLenRef = useRef(localHistory.length);

    // Firebase real-time listener (if user authenticated)
    useEffect(() => {
        if (!userId) return;
        try {
            const ref = collection(db, "footprints");
            const q = query(ref, where("userId", "==", userId), orderBy("createdAt", "asc"));
            const unsub = onSnapshot(q, (snap) => {
                const docs = snap.docs.map((d) => ({
                    ...d.data(),
                    createdAt: d.data().createdAt?.toDate(),
                })) as HistoryEntry[];
                if (docs.length > 0) {
                    setHistory(docs);
                }
            }, () => { /* ignore errors, fall back to localStorage */ });
            return unsub;
        } catch {
            // Firebase not available, use localStorage data
        }
    }, [userId]);

    // Sync when parent updates localStorage data
    useEffect(() => {
        setHistory(localHistory);
        if (localHistory.length > prevLenRef.current) {
            setJustUpdated(true);
            setTimeout(() => setJustUpdated(false), 1200);
        }
        prevLenRef.current = localHistory.length;
    }, [localHistory]);

    const chronological = [...history].reverse(); // oldest → newest
    const sliced = range === 9999 ? chronological : chronological.slice(-range);

    const chartData: ChartPoint[] = sliced.map((e, i) => ({
        label: formatLabel(e.timestamp, i),
        value: Number(e.total) || 0,
        isLast: i === sliced.length - 1,
    }));

    const gradientId = "mountainGrad";
    const RANGES: { label: string; value: Range }[] = [
        { label: "Last 10", value: 10 },
        { label: "Last 30", value: 30 },
        { label: "All", value: 9999 },
    ];

    if (chartData.length === 0) return null;

    return (
        <motion.div
            animate={justUpdated ? { scale: [1, 1.015, 1] } : { scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border rounded-3xl p-5 relative overflow-hidden"
        >
            {/* Subtle glow on update */}
            <AnimatePresence>
                {justUpdated && (
                    <motion.div
                        key="glow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-3xl pointer-events-none"
                        style={{ boxShadow: "0 0 32px 4px #4CD96430" }}
                    />
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-sm">Your Footprint Journey</h3>
                    <p className="text-xs text-muted-foreground">{chartData.length} data points</p>
                </div>
                <div className="flex gap-1">
                    {RANGES.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setRange(r.value)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${range === r.value
                                    ? "bg-[#4CD964]/15 text-[#4CD964] border border-[#4CD964]/30"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4CD964" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#0B3B2A" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}t`}
                        domain={["dataMin - 0.5", "dataMax + 0.5"]}
                        width={32}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#6BAA75"
                        strokeWidth={2.5}
                        fill={`url(#${gradientId})`}
                        isAnimationActive
                        animationDuration={500}
                        dot={(props: any) => (
                            <LeadingDot {...props} dataLength={chartData.length} />
                        )}
                        activeDot={{ r: 5, fill: "#4CD964", stroke: "#fff", strokeWidth: 2 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Latest value badge */}
            <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4CD964] animate-pulse" />
                <span className="text-xs text-muted-foreground">
                    Latest: <span className="font-bold text-[#4CD964]">{chartData[chartData.length - 1]?.value.toFixed(2)} tCO₂e</span>
                </span>
            </div>
        </motion.div>
    );
}
