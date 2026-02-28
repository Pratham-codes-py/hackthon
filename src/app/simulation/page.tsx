"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  FlaskConical, TrendingDown, TreePine,
  Car, Plane, Sparkles, Check, Plus, Eye, EyeOff, Activity, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/layout/Navbar";
import { mockAISuggestions } from "@/lib/mock-data";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// New real-data components

import CategoryBars from "@/components/simulation/CategoryBars";
import ZoomableTimeline from "@/components/simulation/ZoomableTimeline";
import LiveStats from "@/components/simulation/LiveStats";

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Simulation helpers ───────────────────────────────────────────────────────
function generateSimData(totalSavings: number, adoptionMonths: number, enableStretch: boolean, realBaseline?: number) {
  const baseline = realBaseline ?? 10.2;
  const months = ["Now", "Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6",
    "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"];

  return months.map((month, i) => {
    const progress = Math.min(i / adoptionMonths, 1);
    const eased = 1 - Math.pow(1 - progress, 2);
    const withStrat = Math.max(baseline - totalSavings * eased, baseline * 0.3);
    const stretchSavings = totalSavings * 1.5;
    const stretchVal = Math.max(baseline - stretchSavings * eased, baseline * 0.2);
    return {
      month,
      baseline: parseFloat((baseline + i * 0.1).toFixed(2)),
      withStrategies: parseFloat(withStrat.toFixed(2)),
      stretch: enableStretch ? parseFloat(stretchVal.toFixed(2)) : undefined,
    };
  });
}

// ─── Linear regression for prediction ────────────────────────────────────────
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold mb-2 text-xs text-muted-foreground">{label}</p>
        {payload.map((p) => p.value != null && (
          <div key={p.name} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-bold">{p.value.toFixed(2)} tCO₂e</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

const EQUIVALENTS = [
  { factor: 4.6, icon: <Car className="w-4 h-4" />, template: (n: number) => `${n.toFixed(1)} months of avg driving` },
  { factor: 0.5, icon: <Plane className="w-4 h-4" />, template: (n: number) => `${n.toFixed(1)} transatlantic flights avoided` },
  { factor: 50, icon: <TreePine className="w-4 h-4" />, template: (n: number) => `${Math.round(n)} trees planted equivalent` },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SimulationPage() {
  // ── Simulation state ──────────────────────────────────────────────────────
  const [adoptionMonths, setAdoptionMonths] = useState(6);
  const [enableStretch, setEnableStretch] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [activeStrategies, setActiveStrategies] = useState<Set<string>>(
    new Set(["transit", "led-bulbs", "smart-thermostat"])
  );

  // ── Real data state ───────────────────────────────────────────────────────
  const [footprintHistory, setFootprintHistory] = useState<FootprintEntry[]>([]);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  // Strategies saved from the suggestions page
  const [savedStrategySavings, setSavedStrategySavings] = useState(0);

  // ── Firebase auth listener ────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid);
    });
    return unsub;
  }, []);

  // ── Load from localStorage (main source) ─────────────────────────────────
  useEffect(() => {
    const load = () => {
      const raw = localStorage.getItem("footprintHistory");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFootprintHistory(parsed);
          }
        } catch { /* ignore */ }
      }
    };
    load();
    const interval = setInterval(load, 5000);

    // Load saved strategies from suggestions page
    const loadStrategies = () => {
      try {
        const raw = localStorage.getItem("selectedStrategies");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const total = parsed
              .filter((s: any) => s.selected)
              .reduce((acc: number, s: any) => acc + (Number(s.savingsPerYear) || 0), 0);
            setSavedStrategySavings(total);
          }
        }
      } catch { /* ignore */ }
    };
    loadStrategies();
    const stratInterval = setInterval(loadStrategies, 5000);
    return () => { clearInterval(interval); clearInterval(stratInterval); };
  }, []);

  // ── Firebase real-time listener (supplements localStorage) ───────────────
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
      }, () => { /* ignore errors */ });
      return unsub;
    } catch { /* Firebase unavailable */ }
  }, [userId]);

  // ── Simulation calc ───────────────────────────────────────────────────────
  // Combine mock strategy toggles + real saved strategies from suggestions page
  const mockSelectedSavings = mockAISuggestions
    .filter((s) => activeStrategies.has(s.id))
    .reduce((a, s) => a + s.savingsPerYear, 0);
  const totalSavings = mockSelectedSavings + savedStrategySavings;

  // Use real latest footprint as the baseline start (fall back to 10.2)
  const realBaseline = footprintHistory.length > 0 ? Number((footprintHistory[0] as any).total) : 10.2;

  const simData = useMemo(
    () => generateSimData(totalSavings, adoptionMonths, enableStretch, realBaseline),
    [totalSavings, adoptionMonths, enableStretch, realBaseline]
  );

  const projectedEnd = simData[simData.length - 1]?.withStrategies ?? realBaseline;

  // ── Prediction line ───────────────────────────────────────────────────────
  const predictionData = useMemo(() => {
    if (!showPrediction || footprintHistory.length < 2) return simData;

    // Use last 7 entries oldest→newest for regression
    const last7 = [...footprintHistory].slice(0, 7).reverse();
    const vals = last7.map((e) => Number(e.total));
    const { slope, intercept } = linearRegression(vals);

    // If regression went UP (positive slope) from history, force it downward
    // using a modest negative slope so it stays visually meaningful
    const effectiveSlope = slope > 0 ? -Math.abs(intercept * 0.015) : slope;

    // Anchor the prediction line at the user's real current value
    const startVal = realBaseline;

    const extendedData = simData.map((point, i) => {
      // Linear projection from real current value using effective slope
      const rawPredicted = startVal + effectiveSlope * i;
      // Clamp between withStrategies (floor) and baseline (ceiling) at this point
      const lo = point.withStrategies;
      const hi = point.baseline;
      const clamped = Math.min(Math.max(rawPredicted, lo), hi);
      return { ...point, predicted: parseFloat(clamped.toFixed(2)) };
    });
    return extendedData;
  }, [showPrediction, footprintHistory, simData, realBaseline]);

  const toggleStrategy = useCallback((id: string) => {
    setActiveStrategies((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const hasRealData = footprintHistory.length > 0;
  const latestEntry = footprintHistory[0];
  const previousEntry = footprintHistory[1];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="pt-6 mb-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-500">Simulation Lab</span>
          </div>
          <h1 className="text-3xl font-black">🔮 Your Carbon Future</h1>
          <p className="text-muted-foreground mt-1">Adjust variables below to see how your choices unfold over the next 12 months</p>
        </div>

        {/* ── Live Stats Banner (only when data exists) ── */}
        {hasRealData && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#4CD964] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#4CD964]">Live Data</span>
            </div>
            <LiveStats history={footprintHistory} projectedSavings={totalSavings} />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left column: charts ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Impact callout */}
            <motion.div
              key={totalSavings}
              initial={{ scale: 0.98, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl p-6 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0B3B2A, #2D7D4A)" }}
            >
              <div className="absolute inset-0 leaf-pattern opacity-20" />
              <div className="relative z-10">
                <p className="text-white/60 text-sm">You'll save</p>
                <div className="text-5xl font-black text-[#4CD964]">{totalSavings.toFixed(2)} tons</div>
                <p className="text-white/70 text-sm mt-1">of CO₂ by the end of the year</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  {EQUIVALENTS.map(({ icon, template, factor }, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-white/60 bg-white/10 px-3 py-1.5 rounded-full">
                      {icon}
                      <span>{template(totalSavings * factor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Main projection chart */}
            <div className="bg-card border border-border rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-bold">12-Month Carbon Projection</h2>
                <div className="flex items-center gap-3">
                  {/* Prediction toggle */}
                  {footprintHistory.length >= 2 && (
                    <button
                      onClick={() => setShowPrediction(!showPrediction)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${showPrediction
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        : "text-muted-foreground border-border hover:text-foreground"
                        }`}
                    >
                      {showPrediction ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      Prediction
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground">Stretch goal</span>
                  <Switch
                    checked={enableStretch}
                    onCheckedChange={setEnableStretch}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </div>

              {/* Prediction explanation box */}
              <AnimatePresence>
                {showPrediction && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div className="flex items-start gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2.5">
                      <Info className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-purple-300/90 leading-relaxed">
                        <span className="font-semibold text-purple-300">What is this?</span> Uses{" "}
                        <span className="font-medium">linear regression</span> on your last{" "}
                        {Math.min(footprintHistory.length, 7)} entries to extrapolate your footprint
                        if current habits continue — independent of any strategies you've selected.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}t`} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <ReferenceLine y={projectedEnd} stroke="#4CD964" strokeDasharray="4 2" strokeWidth={1} opacity={0.5} />
                  <Line type="monotone" dataKey="baseline" name="Baseline (no change)" stroke="#94a3b8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="withStrategies" name="With your strategies" stroke="#4CD964" strokeWidth={2.5} dot={{ r: 3, fill: "#4CD964" }} />
                  {enableStretch && (
                    <Line type="monotone" dataKey="stretch" name="Stretch goal" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                  )}
                  {showPrediction && (
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      name="Predicted trend"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
              {showPrediction && (
                <p className="text-xs text-center text-muted-foreground mt-2 italic">
                  📈 Predicted if current trends continue (based on your last {Math.min(footprintHistory.length, 7)} entries)
                </p>
              )}
            </div>

            {/* Adoption speed slider */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold mb-1">Adoption Speed</h3>
              <p className="text-sm text-muted-foreground mb-4">How quickly will you implement your chosen strategies?</p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-24 text-right">Slow &amp; steady</span>
                <div className="flex-1">
                  <Slider
                    value={[adoptionMonths]}
                    onValueChange={([v]) => setAdoptionMonths(v)}
                    min={1} max={12} step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>1 month</span>
                    <span className="font-bold text-[#4CD964]">Target: {adoptionMonths} months</span>
                    <span>12 months</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-24">Go green fast</span>
              </div>
            </div>

            {/* ── Real Data Section ── */}
            <AnimatePresence>
              {hasRealData && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#4CD964]/10 border border-[#4CD964]/20">
                      <Activity className="w-3.5 h-3.5 text-[#4CD964]" />
                      <span className="text-xs font-bold text-[#4CD964] uppercase tracking-wide">Your Real Data</span>
                    </div>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* ── Timeline Explorer ── */}
                  {footprintHistory.length >= 3 && (
                    <ZoomableTimeline history={footprintHistory} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* No data nudge */}
            {!hasRealData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-dashed border-border rounded-3xl p-8 text-center"
              >
                <div className="text-4xl mb-3">📊</div>
                <h3 className="font-bold mb-1">No footprint data yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Submit the footprint form once to unlock your personal real-time charts here.
                </p>
                <a href="/input" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4CD964]/10 text-[#4CD964] border border-[#4CD964]/20 text-sm font-medium hover:bg-[#4CD964]/20 transition-colors">
                  Calculate my footprint →
                </a>
              </motion.div>
            )}
          </div>

          {/* ── Strategy panel ── */}
          <div className="space-y-4">
            {/* Active Strategies */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6BAA75]" />
                Active Strategies
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Toggle strategies to see their impact on the chart</p>

              <div className="space-y-2">
                {mockAISuggestions.map((s) => (
                  <motion.button
                    key={s.id}
                    whileHover={{ x: 2 }}
                    onClick={() => toggleStrategy(s.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${activeStrategies.has(s.id)
                      ? "border-[#6BAA75] bg-[#6BAA75]/5 dark:border-[#4CD964] dark:bg-[#4CD964]/5"
                      : "border-border opacity-50 hover:opacity-70"
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${activeStrategies.has(s.id) ? "border-[#4CD964] bg-[#4CD964]" : "border-muted-foreground"
                      }`}>
                      {activeStrategies.has(s.id) && <Check className="w-3 h-3 text-white dark:text-[#0A1F18]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.savingsPerYear}t/yr</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Add Custom Strategy — moved up above Summary */}
            <Button variant="outline" className="w-full rounded-xl border-dashed gap-2 text-muted-foreground hover:text-foreground">
              <Plus className="w-4 h-4" />
              Add Custom Strategy
            </Button>

            {/* Summary card */}
            <div className="bg-gradient-to-br from-[#0B3B2A] to-[#2D7D4A] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-[#4CD964]" />
                <span className="font-bold">Summary</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">
                    {hasRealData ? "Latest footprint" : "Baseline footprint"}
                  </span>
                  <span className="font-bold">
                    {hasRealData ? `${latestEntry?.total?.toFixed(1)} t/yr` : "10.2 t/yr"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">With strategies</span>
                  <span className="font-bold text-[#4CD964]">{projectedEnd.toFixed(1)} t/yr</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between">
                  <span className="text-white/60">Total reduction</span>
                  <span className="font-black text-xl text-[#4CD964]">-{totalSavings.toFixed(1)}t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Reduction %</span>
                  <span className="font-bold text-[#4CD964]">{Math.round((totalSavings / 10.2) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Category Bars — moved to right sidebar below Summary */}
            {hasRealData && (
              <CategoryBars
                current={latestEntry ? {
                  transport: latestEntry.transport ?? 0,
                  energy: latestEntry.energy ?? 0,
                  diet: latestEntry.diet ?? 0,
                  waste: latestEntry.waste ?? 0,
                } : undefined}
                previous={previousEntry ? {
                  transport: previousEntry.transport ?? 0,
                  energy: previousEntry.energy ?? 0,
                  diet: previousEntry.diet ?? 0,
                  waste: previousEntry.waste ?? 0,
                } : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
