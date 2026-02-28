"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  Car, Home, Utensils, Recycle, TrendingDown, TrendingUp,
  Sparkles, Share2, Plus, ChevronDown, ChevronUp, Zap,
  Award, Flame, Target, Info, Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import { mockChartData, mockFootprintHistory } from "@/lib/mock-data";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

// Animated number counter
function CountUp({ end, decimals = 1, duration = 1.5 }: { end: number; decimals?: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * end).toFixed(decimals)));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, decimals, duration]);

  return <span ref={ref}>{value.toFixed(decimals)}</span>;
}

// Category Card
interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  total: number;
  color: string;
  breakdown: { label: string; value: number }[];
  tip: string;
}

function CategoryCard({ icon, title, value, total, color, breakdown, tip }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((value / total) * 100);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
              <div style={{ color }}>{icon}</div>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">{pct}% of total</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-black text-xl" style={{ color }}>{value.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">tons/yr</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Expand indicator */}
        <div className="flex items-center justify-center mt-3 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded content */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: expanded ? "auto" : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(item.value / value) * 100}%`, backgroundColor: color }} />
                </div>
                <span className="font-medium w-12 text-right">{item.value.toFixed(2)} t</span>
              </div>
            </div>
          ))}
          <div className="bg-muted/50 rounded-xl p-3 mt-2">
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {tip}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Custom chart tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-semibold">{p.value?.toFixed(1)} tCO₂e</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

const DONUT_COLORS = ["#2D7D4A", "#6BAA75", "#8B5A2B", "#0B3B2A"];

export default function DashboardPage() {
  const [chartView, setChartView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [currentDate, setCurrentDate] = useState("");
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [footprints, setFootprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));

    // Guard 1: must be logged in
    const email = localStorage.getItem("userEmail");
    if (!email) {
      router.replace("/");
      return;
    }

    // Guard 2: must have completed the form
    const latest = localStorage.getItem("latestFootprint");
    if (!latest) {
      router.replace("/input");
      return;
    }

    const name = localStorage.getItem("userName") || email.split('@')[0];
    setUser({ email, name });

    // Fetch real data from Firebase Firestore
    const fetchDBData = async () => {
      try {
        const q = query(
          collection(db, "footprints"),
          where("userEmail", "==", email)
        );
        const snapshot = await getDocs(q);
        const history: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          history.push({
            ...data,
            // Convert Firestore timestamp or fallback to stored timestamp string
            createdAt: data.createdAt?.toDate()?.toISOString() || data.timestamp
          });
        });

        // Sort history by date ascending (oldest to newest) since we removed orderBy
        history.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        if (history.length > 0) {
          setFootprints(history);
        } else {
          // Fallback to local storage if DB is empty or fails
          const historyStr = localStorage.getItem("footprintHistory");
          if (historyStr) {
            const localHistory = JSON.parse(historyStr);
            if (Array.isArray(localHistory) && localHistory.length > 0) {
              setFootprints(localHistory);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch history from Firestore", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDBData();
  }, [router]);

  // Mock user data for now - replace with actual user data from your database
  const displayUser = {
    name: user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    points: 2150,
    level: 12,
    streak: 7,
    totalCO2Saved: 15.2,
    actionsCompleted: 42
  };

  // Determine which data to show
  const activeData = footprints.length > 0 ? footprints : mockFootprintHistory;
  const currentEntry = activeData[activeData.length - 1];
  const previousEntry = activeData.length > 1 ? activeData[activeData.length - 2] : null;

  // Calculate trend against previous entry or default to 0
  const trendPct = previousEntry
    ? Math.round(((currentEntry.total - previousEntry.total) / (previousEntry.total || 1)) * 100)
    : 0;

  const pieData = [
    { name: "Transport", value: currentEntry.transport },
    { name: "Energy", value: currentEntry.energy },
    { name: "Diet", value: currentEntry.diet },
    { name: "Waste", value: currentEntry.waste },
  ];

  const levelPct = Math.round(((displayUser.points - 1700) / (2400 - 1700)) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#6BAA75]/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Leaf className="w-8 h-8 text-[#6BAA75]" />
              </div>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* ── Dashboard Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pt-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-black text-foreground"
            >
              Hi, <span className="text-[#6BAA75] dark:text-[#4CD964]">{displayUser.name}</span>! Here's your 2026 impact 🌍
            </motion.h1>
            <p className="text-muted-foreground text-sm mt-1">Last updated: {currentDate}</p>
          </div>

          {/* Points ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-sm text-orange-600 dark:text-orange-400">{displayUser.streak} day streak</span>
            </div>
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="#6BAA75" strokeWidth="5"
                  strokeDasharray={`${levelPct * 1.38} 138`}
                  className="dark:stroke-[#4CD964] transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-black text-[#6BAA75] dark:text-[#4CD964] leading-none">{displayUser.points}</span>
                <span className="text-[8px] text-muted-foreground leading-none">pts</span>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#6BAA75]/10">
              <Award className="w-4 h-4 text-[#6BAA75] dark:text-[#4CD964]" />
              <span className="text-xs font-semibold text-[#6BAA75] dark:text-[#4CD964]">Lvl {displayUser.level}</span>
            </div>
          </motion.div>
        </div>

        {/* ── Hero Metric ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl p-8 mb-8 text-white"
          style={{ background: "linear-gradient(135deg, #0B3B2A 0%, #2D7D4A 60%, #6BAA75 100%)" }}
        >
          <div className="absolute inset-0 leaf-pattern opacity-20" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2">
              <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Your Annual Footprint</p>
              <div className="text-6xl sm:text-7xl font-black tracking-tight mb-2">
                <CountUp end={currentEntry.total} decimals={1} duration={2} />{" "}
                <span className="text-3xl font-bold text-white/60">tCO₂e</span>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold mb-3 ${trendPct < 0 ? "bg-[#4CD964]/20 text-[#4CD964]" : "bg-red-500/20 text-red-300"
                }`}>
                {trendPct < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {Math.abs(trendPct)}% {trendPct < 0 ? "lower" : "higher"} than last month
              </div>
              <p className="text-white/50 text-sm">
                ≈ <strong className="text-white/70">2 round-trip flights</strong> from NYC to London<br />
                or charging your phone <strong className="text-white/70">1.2 million times</strong>
              </p>
            </div>

            {/* Donut chart */}
            <div className="flex flex-col items-center">
              <PieChart width={180} height={180}>
                <Pie data={pieData} cx={90} cy={90} innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={DONUT_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${Number(v).toFixed(2)} t`, ""]} />
              </PieChart>
              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-1">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/70">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Category Breakdown ── */}
        <h2 className="text-lg font-bold mb-4">Breakdown by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <CategoryCard
            icon={<Car className="w-5 h-5" />} title="Transport" value={currentEntry.transport} total={currentEntry.total}
            color="#2D7D4A"
            breakdown={[{ label: "Car", value: 2.1 }, { label: "Transit", value: 0.7 }, { label: "Flights", value: 0.6 }]}
            tip="Try taking public transit 2 more days/week to save 0.5 tons/year."
          />
          <CategoryCard
            icon={<Home className="w-5 h-5" />} title="Energy" value={currentEntry.energy} total={currentEntry.total}
            color="#6BAA75"
            breakdown={[{ label: "Electricity", value: 2.2 }, { label: "Heating", value: 0.9 }]}
            tip="Switching to LED bulbs and a smart thermostat could save 0.85 tons/year."
          />
          <CategoryCard
            icon={<Utensils className="w-5 h-5" />} title="Diet" value={currentEntry.diet} total={currentEntry.total}
            color="#8B5A2B"
            breakdown={[{ label: "Meat & Dairy", value: 1.8 }, { label: "Other Food", value: 0.7 }]}
            tip="Going vegetarian 3 days/week could reduce your diet footprint by 0.4 tons/year."
          />
          <CategoryCard
            icon={<Recycle className="w-5 h-5" />} title="Waste" value={currentEntry.waste} total={currentEntry.total}
            color="#0B3B2A"
            breakdown={[{ label: "Landfill", value: 1.0 }, { label: "Recycling impact", value: 0.4 }]}
            tip="Starting composting could eliminate ~0.25 tons/year from landfill methane."
          />
        </div>

        {/* ── Main Chart ── */}
        <div className="bg-card border border-border rounded-3xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold">Your Carbon Timeline</h2>
              <p className="text-sm text-muted-foreground">Actual footprint history</p>
            </div>
            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setChartView(v)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${chartView === v
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={(() => {
                // Use real data if we have it, otherwise fallback to mock so it's never empty
                const sourceData = activeData;
                if (sourceData.length === 0) return [];

                const now = new Date();

                // 1. Generate empty trailing periods based on the view so the graph never flatlines
                // This ensures we always show a timeline (e.g. last 7 days) even if data only exists for today.
                const periods: string[] = [];
                if (chartView === "daily") {
                  for (let i = 6; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(d.getDate() - i);
                    periods.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
                  }
                } else if (chartView === "weekly") {
                  for (let i = 3; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(d.getDate() - (i * 7));
                    const diff = d.getDate() - d.getDay();
                    const weekStart = new Date(d.setDate(diff));
                    periods.push("Wk of " + weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
                  }
                } else if (chartView === "monthly") {
                  for (let i = 5; i >= 0; i--) {
                    const d = new Date(now);
                    d.setMonth(d.getMonth() - i);
                    periods.push(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
                  }
                }

                // 2. Initialize aggregated map with 0s for our trailing periods
                const aggregated = new Map<string, number>();
                periods.forEach(p => aggregated.set(p, 0));

                const getGroupKey = (dateStr: string, view: string) => {
                  const d = new Date(dateStr);
                  if (view === "daily") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  if (view === "weekly") {
                    const diff = d.getDate() - d.getDay();
                    const weekStart = new Date(d.setDate(diff));
                    return "Wk of " + weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }
                  if (view === "monthly") return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                  return dateStr;
                };

                // 3. Populate map with actual data sums
                sourceData.forEach(entry => {
                  const dateToUse = entry.createdAt || entry.timestamp || new Date().toISOString();
                  const key = getGroupKey(dateToUse, chartView);
                  // We only care about data that falls into our trailing periods for the chart
                  if (aggregated.has(key)) {
                    aggregated.set(key, (aggregated.get(key) || 0) + Number(entry.total));
                  }
                });

                // 4. Convert map to array for Recharts
                // Because we pre-filled the map in chronological order, iteration maintains that order
                return Array.from(aggregated.entries()).map(([label, sum]) => ({
                  label,
                  actual: parseFloat(sum.toFixed(2))
                }));
              })()}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CD964" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4CD964" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}t`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
              <Area
                type="monotone"
                dataKey="actual"
                name="Your Footprint"
                stroke="#4CD964"
                strokeWidth={3}
                fill="url(#colorActual)"
                dot={{ r: 4, fill: "#4CD964", strokeWidth: 2, stroke: "var(--background)" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/input">
            <motion.div
              whileHover={{ y: -2 }}
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl cursor-pointer hover:border-[#6BAA75] transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#6BAA75]/10 group-hover:bg-[#6BAA75]/20 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-[#6BAA75] dark:text-[#4CD964]" />
              </div>
              <div>
                <p className="font-semibold text-sm">Log Today's Activity</p>
                <p className="text-xs text-muted-foreground">Update your footprint</p>
              </div>
            </motion.div>
          </Link>

          <Link href="/suggestions">
            <motion.div
              whileHover={{ y: -2 }}
              className="flex items-center gap-3 p-4 bg-card border border-[#6BAA75]/30 dark:border-[#4CD964]/30 rounded-2xl cursor-pointer hover:border-[#6BAA75] transition-colors group relative"
            >
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#4CD964] flex items-center justify-center">
                <span className="text-[10px] font-black text-[#0A1F18]">3</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#6BAA75]/10 flex items-center justify-center animate-pulse-glow">
                <Sparkles className="w-5 h-5 text-[#6BAA75] dark:text-[#4CD964]" />
              </div>
              <div>
                <p className="font-semibold text-sm">View AI Suggestions</p>
                <p className="text-xs text-[#6BAA75] dark:text-[#4CD964] font-medium">3 new for you</p>
              </div>
            </motion.div>
          </Link>

          <motion.div
            whileHover={{ y: -2 }}
            className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl cursor-pointer hover:border-[#6BAA75] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#6BAA75]/10 group-hover:bg-[#6BAA75]/20 flex items-center justify-center transition-colors">
              <Share2 className="w-5 h-5 text-[#6BAA75] dark:text-[#4CD964]" />
            </div>
            <div>
              <p className="font-semibold text-sm">Share Progress</p>
              <p className="text-xs text-muted-foreground">Generate shareable card</p>
            </div>
          </motion.div>
        </div>

        {/* ── Mini Stats Row ── */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { icon: <Target className="w-5 h-5" />, label: "Total Saved", value: `${displayUser.totalCO2Saved}t CO₂`, color: "#6BAA75" },
            { icon: <Zap className="w-5 h-5" />, label: "Actions Done", value: displayUser.actionsCompleted.toString(), color: "#8B5A2B" },
            { icon: <Award className="w-5 h-5" />, label: "Badges Earned", value: "8 / 10", color: "#2D7D4A" },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
                {icon}
              </div>
              <div className="font-black text-lg" style={{ color }}>{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
