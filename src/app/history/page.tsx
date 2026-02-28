"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar, TrendingDown, TrendingUp, Star, AlertCircle,
  ChevronRight, BarChart2, Brain, Filter
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ─── Calendar helpers ─────────────────────────────────────────────────────────
// Streak days: Feb 27 and Feb 28 (today) are the only colored days
const STREAK_DAYS = new Set([27, 28]);

function generateCalendarDays() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<{ day: number; level: "none" | "low" | "medium" | "high" | "today"; value?: number }> = [];
  for (let i = 0; i < firstDay; i++) days.push({ day: 0, level: "none" });
  for (let d = 1; d <= daysInMonth; d++) {
    let level: "none" | "low" | "medium" | "high" | "today";
    if (d > today.getDate()) {
      level = "none"; // future
    } else if (d === today.getDate()) {
      level = "today"; // today (Feb 28)
    } else if (STREAK_DAYS.has(d)) {
      level = "low"; // streak day (Feb 27) — green
    } else {
      level = "none"; // all other past days — grey/transparent
    }
    days.push({
      day: d,
      level,
      value: level === "low" ? 0.028 : undefined,
    });
  }
  return days;
}

const LEVEL_COLORS: Record<string, string> = {
  none: "bg-muted/30 text-muted-foreground/40",
  low: "bg-[#4CD964]/70",
  medium: "bg-amber-400/80",
  high: "bg-red-500/80",
  today: "bg-[#0B3B2A] dark:bg-[#4CD964] ring-2 ring-[#4CD964] ring-offset-1",
};

// ─── Relative time ────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface FootprintEntry {
  total: number;
  transport: number;
  energy: number;
  diet: number;
  waste: number;
  timestamp?: string;
  createdAt?: Date;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [calendarDays, setCalendarDays] = useState<Array<{ day: number; level: "none" | "low" | "medium" | "high" | "today"; value?: number }>>([]);
  const [footprintHistory, setFootprintHistory] = useState<FootprintEntry[]>([]);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Generate calendar once on client
  useEffect(() => {
    setCalendarDays(generateCalendarDays());
  }, []);

  // Firebase auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUserId(user?.uid));
    return unsub;
  }, []);

  // Load from localStorage (primary)
  useEffect(() => {
    const load = () => {
      const raw = localStorage.getItem("footprintHistory");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // newest-first
            setFootprintHistory([...parsed].reverse());
          }
        } catch { /* ignore */ }
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Firebase real-time (supplement)
  useEffect(() => {
    if (!userId) return;
    try {
      const ref = collection(db, "footprints");
      const q = query(ref, where("userId", "==", userId), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        if (snap.empty) return;
        const docs = snap.docs.map((d) => ({
          ...d.data(),
          createdAt: d.data().createdAt?.toDate(),
        })) as FootprintEntry[];
        setFootprintHistory(docs);
      }, () => { /* ignore */ });
      return unsub;
    } catch { /* Firebase unavailable */ }
  }, [userId]);

  // ── Computed insights from real data ──────────────────────────────────────
  const hasData = footprintHistory.length > 0;
  const latestEntry = footprintHistory[0];
  const oldest = footprintHistory[footprintHistory.length - 1];

  // Best entry (lowest total)
  const bestEntry = hasData
    ? footprintHistory.reduce((a, b) => a.total < b.total ? a : b)
    : null;

  // Worst category in latest entry
  const worstCategory = hasData && latestEntry
    ? (["transport", "energy", "diet", "waste"] as const).reduce(
      (a, b) => (latestEntry[a] ?? 0) > (latestEntry[b] ?? 0) ? a : b
    )
    : "energy";

  // Avg reduction per submission
  const avgReduction = hasData && footprintHistory.length >= 2
    ? (((oldest?.total ?? 0) - (latestEntry?.total ?? 0)) / (footprintHistory.length - 1))
    : 0;

  // Transport reduction %
  const transportReduction = hasData && footprintHistory.length >= 2 && oldest?.transport
    ? Math.round(((oldest.transport - (latestEntry?.transport ?? 0)) / oldest.transport) * 100)
    : 0;

  // vs Indian avg (1.5 t/yr per capita)
  const INDIAN_AVG = 1.5;
  const vsDiff = hasData && latestEntry
    ? Math.round(((INDIAN_AVG - latestEntry.total) / INDIAN_AVG) * 100)
    : 0;

  const currentMonth = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

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
            History &amp; Insights
          </motion.h1>
          <p className="text-muted-foreground mt-1">Your full sustainability record and AI-generated insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column: Calendar + Table */}
          <div className="lg:col-span-2 space-y-6">

            {/* Calendar */}
            <div className="bg-card border border-border rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">{currentMonth}</h2>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#4CD964]/70" /> Low</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-400/80" /> Medium</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/80" /> High</div>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>

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

            {/* Detailed history table — real data */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="font-bold">Detailed History</h2>
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Filter className="w-3.5 h-3.5" /> Filter
                </button>
              </div>

              {!hasData ? (
                <div className="p-10 text-center text-muted-foreground">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-semibold">No submissions yet</p>
                  <p className="text-sm mt-1">Complete the footprint form to see your history here.</p>
                  <a href="/input" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#4CD964]/10 text-[#4CD964] border border-[#4CD964]/20 text-sm font-medium hover:bg-[#4CD964]/20 transition-colors">
                    Calculate my footprint →
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {["Date", "Total", "Transport", "Energy", "Diet", "Waste", "Change"].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {footprintHistory.map((entry, i) => {
                        const prev = footprintHistory[i + 1];
                        const change = prev ? ((entry.total - prev.total) / prev.total) * 100 : 0;
                        const dateLabel = entry.timestamp
                          ? new Date(entry.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : entry.createdAt
                            ? new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : "Recent";
                        return (
                          <motion.tr
                            key={entry.timestamp || i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`hover:bg-muted/30 transition-colors cursor-pointer ${i === 0 ? "bg-[#4CD964]/5" : ""}`}
                          >
                            <td className="px-4 py-3 font-medium">
                              <div className="flex items-center gap-2">
                                {i === 0 && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#4CD964]/20 text-[#4CD964] border border-[#4CD964]/30">
                                    Latest
                                  </span>
                                )}
                                <span>{dateLabel}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold">{Number(entry.total).toFixed(2)}t</td>
                            <td className="px-4 py-3 text-muted-foreground">{Number(entry.transport).toFixed(2)}t</td>
                            <td className="px-4 py-3 text-muted-foreground">{Number(entry.energy).toFixed(2)}t</td>
                            <td className="px-4 py-3 text-muted-foreground">{Number(entry.diet).toFixed(2)}t</td>
                            <td className="px-4 py-3 text-muted-foreground">{Number(entry.waste).toFixed(2)}t</td>
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
              )}
            </div>
          </div>

          {/* Right column: Insights */}
          <div className="space-y-5">


            {/* Your Biggest Wins */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-bold">Your Biggest Wins</h3>
              </div>
              <div className="space-y-3">
                {bestEntry ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#4CD964]/10 border border-[#4CD964]/20">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="font-semibold text-sm text-[#4CD964]">Best Submission</p>
                      <p className="text-xs text-muted-foreground">
                        {bestEntry.timestamp
                          ? new Date(bestEntry.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "Recent"} — only {Number(bestEntry.total).toFixed(1)}t CO₂
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#4CD964]/10 border border-[#4CD964]/20">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="font-semibold text-sm text-[#4CD964]">Best Month</p>
                      <p className="text-xs text-muted-foreground">Submit your footprint to see this</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#6BAA75]/10 border border-[#6BAA75]/20">
                  <span className="text-2xl">🚌</span>
                  <div>
                    <p className="font-semibold text-sm">Transport Hero</p>
                    <p className="text-xs text-muted-foreground">
                      {transportReduction > 0
                        ? `Reduced transport by ${transportReduction}% from your first entry`
                        : "Keep logging to track your transport progress"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="font-semibold text-sm">🔥 2 Day Streak</p>
                    <p className="text-xs text-muted-foreground">Feb 27 &amp; 28 — keep it going!</p>
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
                    <p className="font-semibold text-sm capitalize">{hasData ? worstCategory : "Energy"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasData && latestEntry
                      ? `Your ${worstCategory} footprint is ${Number((latestEntry as any)[worstCategory]).toFixed(2)}t — your highest category. Consider targeted reductions here.`
                      : "Home energy has only decreased 2% — well below average. Consider scheduling an energy audit."}
                  </p>
                  <a href="/suggestions" className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline">
                    See suggestions <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="font-semibold text-sm">Diet impact</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasData && latestEntry
                      ? `Diet accounts for ${Number(latestEntry.diet).toFixed(2)}t of your footprint. Plant-Based Mondays could make a big difference.`
                      : "Your diet footprint hasn't improved in 3 months. Plant-Based Mondays could restart progress."}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#6BAA75]" />
                Quick Stats
              </h3>
              {[
                {
                  label: "Avg reduction/submission",
                  value: hasData && avgReduction > 0 ? `-${avgReduction.toFixed(2)}t` : "—",
                  positive: hasData && avgReduction > 0 ? true : null,
                },
                {
                  label: "Best submission",
                  value: bestEntry ? `${Number(bestEntry.total).toFixed(1)}t` : "—",
                  positive: true,
                },
                {
                  label: "Total entries logged",
                  value: hasData ? `${footprintHistory.length} submission${footprintHistory.length > 1 ? "s" : ""}` : "0",
                  positive: null,
                },
                {
                  label: "vs. Indian avg (1.5t/yr)",
                  value: hasData && latestEntry
                    ? vsDiff > 0 ? `+${vsDiff}% above` : `${Math.abs(vsDiff)}% below`
                    : "—",
                  positive: hasData && vsDiff <= 0 ? true : false,
                },
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

