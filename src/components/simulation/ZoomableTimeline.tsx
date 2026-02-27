"use client";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceArea
} from "recharts";
import { ZoomIn, RefreshCw } from "lucide-react";

interface DataPoint {
    label: string;
    value: number;
}

interface Stats {
    min: number;
    max: number;
    avg: number;
    count: number;
}

function computeStats(data: DataPoint[]): Stats {
    if (data.length === 0) return { min: 0, max: 0, avg: 0, count: 0 };
    const vals = data.map((d) => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { min, max, avg, count: data.length };
}

function formatLabel(timestamp: string | undefined, index: number): string {
    if (!timestamp) return `#${index + 1}`;
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface HistoryEntry {
    total: number;
    timestamp?: string;
}

interface ZoomableTimelineProps {
    history: HistoryEntry[];
}

function TooltipContent({ active, payload, label }: any) {
    if (active && payload?.length) {
        return (
            <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
                <p className="text-muted-foreground">{label}</p>
                <p className="font-black text-[#6BAA75]">{payload[0]?.value?.toFixed(2)} tCO₂e</p>
            </div>
        );
    }
    return null;
}

export default function ZoomableTimeline({ history }: ZoomableTimelineProps) {
    const chronological = [...history].reverse();
    const allData: DataPoint[] = chronological.map((e, i) => ({
        label: formatLabel(e.timestamp, i),
        value: Number(e.total) || 0,
    }));

    const [zoomedData, setZoomedData] = useState<DataPoint[]>(allData);
    const [refLeft, setRefLeft] = useState<string | null>(null);
    const [refRight, setRefRight] = useState<string | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    const stats = computeStats(zoomedData);

    const handleMouseDown = useCallback((e: any) => {
        if (!e?.activeLabel) return;
        setRefLeft(e.activeLabel);
        setRefRight(null);
        setIsSelecting(true);
    }, []);

    const handleMouseMove = useCallback((e: any) => {
        if (!isSelecting || !e?.activeLabel) return;
        setRefRight(e.activeLabel);
    }, [isSelecting]);

    const handleMouseUp = useCallback(() => {
        if (!isSelecting) return;
        setIsSelecting(false);
        if (refLeft && refRight && refLeft !== refRight) {
            const idxLeft = allData.findIndex((d) => d.label === refLeft);
            const idxRight = allData.findIndex((d) => d.label === refRight);
            if (idxLeft >= 0 && idxRight >= 0) {
                const [lo, hi] = [Math.min(idxLeft, idxRight), Math.max(idxLeft, idxRight)];
                setZoomedData(allData.slice(lo, hi + 1));
                setIsZoomed(true);
            }
        }
        setRefLeft(null);
        setRefRight(null);
    }, [isSelecting, refLeft, refRight, allData]);

    const resetZoom = () => {
        setZoomedData(allData);
        setIsZoomed(false);
        setRefLeft(null);
        setRefRight(null);
    };

    if (allData.length < 2) return null;

    return (
        <div className="bg-card border border-border rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <ZoomIn className="w-4 h-4 text-[#6BAA75]" />
                        Timeline Explorer
                    </h3>
                    <p className="text-xs text-muted-foreground">Click-drag to zoom into a range</p>
                </div>
                {isZoomed && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={resetZoom}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#6BAA75]/10 text-[#6BAA75] border border-[#6BAA75]/20 hover:bg-[#6BAA75]/20 transition-colors font-medium"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Reset Zoom
                    </motion.button>
                )}
            </div>

            <div className="select-none" style={{ cursor: isSelecting ? "col-resize" : "crosshair" }}>
                <ResponsiveContainer width="100%" height={160}>
                    <LineChart
                        data={zoomedData}
                        margin={{ top: 5, right: 16, left: -10, bottom: 0 }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
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
                            domain={["dataMin - 0.3", "dataMax + 0.3"]}
                            width={32}
                        />
                        <Tooltip content={<TooltipContent />} />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#6BAA75"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: "#6BAA75", stroke: "none" }}
                            activeDot={{ r: 5, fill: "#4CD964", stroke: "#fff", strokeWidth: 2 }}
                            isAnimationActive
                            animationDuration={400}
                        />
                        {refLeft && refRight && (
                            <ReferenceArea
                                x1={refLeft}
                                x2={refRight}
                                strokeOpacity={0.4}
                                fill="#4CD964"
                                fillOpacity={0.12}
                                stroke="#4CD964"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Stats panel */}
            <motion.div
                key={`${stats.min}-${stats.max}-${stats.count}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 grid grid-cols-3 gap-3"
            >
                {[
                    { label: "Min", value: stats.min.toFixed(2), color: "#4CD964" },
                    { label: "Avg", value: stats.avg.toFixed(2), color: "#6BAA75" },
                    { label: "Max", value: stats.max.toFixed(2), color: "#f59e0b" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 rounded-xl bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                        <div className="font-black text-sm" style={{ color }}>{value}t</div>
                    </div>
                ))}
            </motion.div>
            {isZoomed && (
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                    Showing {zoomedData.length} of {allData.length} entries
                </p>
            )}
        </div>
    );
}
