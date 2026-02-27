"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  Calendar, TrendingDown, TrendingUp, Star, AlertCircle,
  ChevronRight, BarChart2, Brain, Filter
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { mockFootprintHistory, mockChartData } from "@/lib/mock-data";

// Generate calendar days with mock data
function generateCalendarDays() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<{ day: number; level: "none" | "low" | "medium" | "high" | "today"; value?: number }> = [];
  for (let i = 0; i < firstDay; i++) days.push({ day: 0, level: "none" });
  for (let d = 1; d <= daysInMonth; d++) {
    // Use deterministic pseudo-random based on day to avoid hydration mismatch
    const seed = d * 9301 + 49297;
    const rnd = (seed % 23480) / 23480; // Normalize to 0-1
    const level = d > today.getDate() ? "none" : d === today.getDate() ? "today" : rnd < 0.35 ? "low" : rnd < 0.65 ? "medium" : "high";
    days.push({ day: d, level, value: level !== "none" && level !== "today" ? parseFloat((0.025 + rnd * 0.01).toFixed(3)) : undefined });
  }
  return days;
}

const LEVEL_COLORS: Record<string, string> = {
  none: "bg-transparent",
  low: "bg-[#4CD964]/70",
  medium: "bg-amber-400/80",
  high: "bg-red-500/80",
  today: "bg-[#0B3B2A] dark:bg-[#4CD964] ring-2 ring-[#4CD964] ring-offset-1",
};

// Stacked bar data
const stackedData = mockFootprintHistory.map((e) => ({
  month: new Date(e.date).toLocaleDateString("en-US", { month: "short" }),
  Transport: e.transport,
  Energy: e.energy,
  Diet: e.diet,
  Waste: e.waste,
}));

const STACK_COLORS = {
  Transport: "#2D7D4A",
  Energy: "#6BAA75",
  Diet: "#8B5A2B",
  Waste: "#0B3B2A",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill: string }>; label?: string }) {
  if (active && payload && payload.length) {
    const total = payload.reduce((a, p) => a + p.value, 0);
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
        <p className="font-semibold text-xs text-muted-foreground mb-2">{label}</p>
        <p className="font-bold text-sm mb-2">{total.toFixed(2)} tCO₂e total</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs mb-0.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.fill }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{p.value.toFixed(2)}t</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function HistoryPage() {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [compareLastYear, setCompareLastYear] = useState(false);
  const [calendarDays, setCalendarDays] = useState<Array<{ day: number; level: "none" | "low" | "medium" | "high" | "today"; value?: number }>>([]);

  useEffect(() => {
    setCalendarDays(generateCalendarDays());
  }, []);

  const bestMonth = mockFootprintHistory.reduce((a, b) => a.total < b.total ? a : b);
  const worstCategory = "Energy"; // Mock
  const avgReduction = 3.7;

  // Long-term chart data (all time)
  const allTimeData = mockChartData.map((d) => ({
    ...d,
    value: d.historical ?? d.projected,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="pt-6 mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black flex items-center gap-3"
          >
            <Calendar className="w-8 h-8 text-[#6BAA75]" />
            History & Insights
          </motion.h1>
          <p className="text-muted-foreground mt-1">Your full sustainability record and AI-generated insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column: Calendar + Table */}
          <div className="lg:col-span-2 space-y-6">

            {/* Calendar */}
            <div className="bg-card border border-border rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">February 2026</h2>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#4CD964]/70" /> Low</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-400/80" /> Medium</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/80" /> High</div>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, i) => (
                  <div
                    key={i}
                    className={`relative aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105 ${day.day === 0 ? "opacity-0 pointer-events-none" : `${LEVEL_COLORS[day.level]}`
                      }`}
                    onMouseEnter={() => day.day > 0 ? setHoveredDay(day.day) : null}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {day.day > 0 && (
                      <>
                        <span className={`text-xs font-medium ${day.level === "today" ? "text-white dark:text-[#0A1F18]" : day.level !== "none" ? "text-white" : "text-muted-foreground"}`}>
                          {day.day}
                        </span>
                        {hoveredDay === day.day && day.value && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0B3B2A] text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                            {day.value}t CO₂
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed history table */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-bold">Detailed History</h2>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Filter className="w-3.5 h-3.5" /> Filter
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Month", "Total", "Transport", "Energy", "Diet", "Waste", "Change"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...mockFootprintHistory].reverse().map((entry, i, arr) => {
                      const prev = arr[i + 1];
                      const change = prev ? ((entry.total - prev.total) / prev.total) * 100 : 0;
                      return (
                        <motion.tr
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3 font-medium">
                            {new Date(entry.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </td>
                          <td className="px-4 py-3 font-bold">{entry.total.toFixed(1)}t</td>
                          <td className="px-4 py-3 text-muted-foreground">{entry.transport.toFixed(1)}t</td>
                          <td className="px-4 py-3 text-muted-foreground">{entry.energy.toFixed(1)}t</td>
                          <td className="px-4 py-3 text-muted-foreground">{entry.diet.toFixed(1)}t</td>
                          <td className="px-4 py-3 text-muted-foreground">{entry.waste.toFixed(1)}t</td>
                          <td className="px-4 py-3">
                            {change !== 0 && (
                              <span className={`font-semibold text-xs ${change < 0 ? "text-[#4CD964]" : "text-red-500"}`}>
                                {change < 0 ? "↓" : "↑"} {Math.abs(change).toFixed(1)}%
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Progress Charts */}
            <div className="space-y-6">
              {/* All time line */}
              <div className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold">All-Time Trend</h2>
                    <p className="text-xs text-muted-foreground">Your footprint journey from the start</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={compareLastYear} onChange={(e) => setCompareLastYear(e.target.checked)} className="rounded" />
                    Compare last year
                  </label>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={allTimeData}>
                    <defs>
                      <linearGradient id="allTimeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6BAA75" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6BAA75" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}t`} />
                    <Tooltip formatter={(v: number | undefined) => [`${v?.toFixed(2) ?? "0.00"}t`, "Footprint"]} />
                    <Area type="monotone" dataKey="value" stroke="#6BAA75" strokeWidth={2.5} fill="url(#allTimeGrad)" dot={{ r: 3, fill: "#6BAA75" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stacked breakdown */}
              <div className="bg-card border border-border rounded-3xl p-6">
                <h2 className="font-bold mb-1">Category Breakdown Over Time</h2>
                <p className="text-xs text-muted-foreground mb-4">How each category has evolved month by month</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stackedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}t`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    {(Object.keys(STACK_COLORS) as Array<keyof typeof STACK_COLORS>).map((key) => (
                      <Bar key={key} dataKey={key} stackId="a" fill={STACK_COLORS[key]} radius={key === "Waste" ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right column: Insights */}
          <div className="space-y-5">

            {/* AI Summary */}
            <div className="bg-gradient-to-br from-[#0B3B2A] to-[#2D7D4A] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-[#4CD964]" />
                <span className="font-bold text-sm">AI Summary</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                You're doing <span className="text-[#4CD964] font-semibold">great with transport</span> — a {avgReduction}% reduction over 6 months! Your next focus should be <span className="text-amber-300 font-semibold">home energy</span>, which remains above average. Try the smart thermostat tip.
              </p>
            </div>

            {/* Your Biggest Wins */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-bold">Your Biggest Wins</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#4CD964]/10 border border-[#4CD964]/20">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <p className="font-semibold text-sm text-[#4CD964]">Best Month</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(bestMonth.date).toLocaleDateString("en-US", { month: "long" })} at only {bestMonth.total.toFixed(1)}t CO₂
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#6BAA75]/10 border border-[#6BAA75]/20">
                  <span className="text-2xl">🚌</span>
                  <div>
                    <p className="font-semibold text-sm">Transport Hero</p>
                    <p className="text-xs text-muted-foreground">Reduced transport by 17% in 6 months</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="font-semibold text-sm">12 Day Streak</p>
                    <p className="text-xs text-muted-foreground">Logging activity consistently</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold">Areas to Improve</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <p className="font-semibold text-sm">{worstCategory}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Home energy has only decreased 2% — well below average. Consider scheduling an energy audit.</p>
                  <button className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline">
                    See suggestions <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="font-semibold text-sm">Diet stagnating</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Your diet footprint hasn't improved in 3 months. Plant-Based Mondays could restart progress.</p>
                </div>
              </div>
            </div>

            {/* Monthly comparison stats */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#6BAA75]" />
                Quick Stats
              </h3>
              {[
                { label: "6-month avg reduction", value: "-3.7%/mo", positive: true },
                { label: "Lowest footprint month", value: `Feb '26 (${bestMonth.total}t)`, positive: true },
                { label: "Total entries logged", value: "6 months", positive: null },
                { label: "vs. US average (16t/yr)", value: "-34% better", positive: true },
              ].map(({ label, value, positive }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-xs font-semibold ${positive === true ? "text-[#4CD964]" : positive === false ? "text-red-500" : "text-foreground"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
