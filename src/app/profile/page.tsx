"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Flame, Zap, Target, Award, TrendingDown,
  Lock, CheckCircle2, Calendar, ChevronRight, Clock, Leaf
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import Navbar from "@/components/layout/Navbar";
import { mockUser, mockBadges, mockFootprintHistory } from "@/lib/mock-data";
import { LEVELS } from "@/lib/constants";
import type { Badge } from "@/lib/types";

const RARITY_COLORS: Record<string, string> = {
  common: "#6BAA75",
  rare: "#4CD964",
  epic: "#a855f7",
  legendary: "#f59e0b",
};

const RARITY_BG: Record<string, string> = {
  common: "from-[#6BAA75]/20 to-[#6BAA75]/5",
  rare: "from-[#4CD964]/20 to-[#4CD964]/5",
  epic: "from-purple-500/20 to-purple-500/5",
  legendary: "from-amber-500/20 to-amber-500/5",
};

function BadgeCard({ badge }: { badge: Badge }) {
  const [showDetails, setShowDetails] = useState(false);
  const color = RARITY_COLORS[badge.rarity];
  const hasProgress = badge.progress != null && badge.maxProgress != null;
  const progressPct = hasProgress ? Math.round((badge.progress! / badge.maxProgress!) * 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      onClick={() => setShowDetails(!showDetails)}
      className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${badge.unlocked
        ? `border-transparent bg-gradient-to-br ${RARITY_BG[badge.rarity]}`
        : "border-border bg-muted/30 opacity-60"
        }`}
      style={badge.unlocked ? { borderColor: `${color}30` } : {}}
    >
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: badge.unlocked ? color : "#94a3b8" }} />
      {!badge.unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
          <Lock className="w-4 h-4 text-muted-foreground/50" />
        </div>
      )}
      <div className={`text-3xl mb-2 ${!badge.unlocked ? "grayscale opacity-30" : ""}`}>{badge.icon}</div>
      <h4 className="font-bold text-xs mb-0.5">{badge.name}</h4>
      <p className="text-xs text-muted-foreground leading-tight">{badge.description}</p>
      {hasProgress && !badge.unlocked && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{badge.progress}/{badge.maxProgress}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: color }} />
          </div>
        </div>
      )}
      {badge.unlocked && (
        <div className="mt-2 flex items-center gap-1 text-xs" style={{ color }}>
          <CheckCircle2 className="w-3 h-3" />
          <span className="font-medium">Unlocked!</span>
        </div>
      )}
    </motion.div>
  );
}

// Relative time helper
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const sparklineData = mockFootprintHistory.map((e) => ({ v: e.total }));

export default function ProfilePage() {
  const [tab, setTab] = useState<"badges" | "history">("badges");
  const [footprintHistory, setFootprintHistory] = useState<any[]>([]);
  const [userName, setUserName] = useState(mockUser.name);
  const [userEmail, setUserEmail] = useState(mockUser.email);

  const nextLevel = LEVELS.find((l) => l.level === mockUser.level + 1);
  const currentLevel = LEVELS.find((l) => l.level === mockUser.level);
  const levelPct = nextLevel
    ? Math.round(((mockUser.points - (currentLevel?.minPoints ?? 0)) / ((nextLevel.minPoints) - (currentLevel?.minPoints ?? 0))) * 100)
    : 100;
  const unlockedCount = mockBadges.filter((b) => b.unlocked).length;

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || mockUser.email;
    const name = localStorage.getItem("userName") || email.split("@")[0];
    setUserEmail(email);
    setUserName(name);

    // Load real footprint history from localStorage
    const historyStr = localStorage.getItem("footprintHistory");
    if (historyStr) {
      try {
        const parsed = JSON.parse(historyStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFootprintHistory([...parsed].reverse()); // most recent first
        }
      } catch { }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* ── Profile Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl mb-8 pt-6"
          style={{ background: "linear-gradient(135deg, #0B3B2A 0%, #2D7D4A 60%, #6BAA75 100%)" }}
        >
          <div className="absolute inset-0 leaf-pattern opacity-20" />
          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#4CD964] flex items-center justify-center text-[#0A1F18] font-black text-3xl shadow-xl">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-xs font-black text-white border-2 border-[#0B3B2A]">
                  {mockUser.level}
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-black text-white">{userName}</h1>
                <p className="text-white/60 text-sm">{userEmail}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    ⚡ Level {mockUser.level} {LEVELS.find((l) => l.level === mockUser.level)?.title}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5" />
                    {mockUser.streak} day streak
                  </div>
                  {footprintHistory.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4CD964]/20 border border-[#4CD964]/30 text-[#4CD964] text-xs font-bold">
                      <Leaf className="w-3.5 h-3.5" />
                      {footprintHistory.length} submission{footprintHistory.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>

              {/* XP ring */}
              <div className="text-center">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                    <motion.circle
                      initial={{ strokeDasharray: "0 201" }}
                      animate={{ strokeDasharray: `${levelPct * 2.01} 201` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      cx="40" cy="40" r="32" fill="none" stroke="#4CD964" strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-white">{mockUser.points}</span>
                    <span className="text-[10px] text-white/50">XP</span>
                  </div>
                </div>
                {nextLevel && (
                  <p className="text-xs text-white/50 mt-1">{nextLevel.minPoints - mockUser.points} to Lvl {mockUser.level + 1}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <TrendingDown className="w-5 h-5" />, label: "CO₂ Saved", value: `${mockUser.totalCO2Saved}t`, color: "#4CD964" },
            { icon: <Zap className="w-5 h-5" />, label: "Actions Done", value: mockUser.actionsCompleted, color: "#6BAA75" },
            { icon: <Award className="w-5 h-5" />, label: "Badges", value: `${unlockedCount}/${mockBadges.length}`, color: "#f59e0b" },
          ].map(({ icon, label, value, color }) => (
            <motion.div
              key={label}
              whileHover={{ y: -2 }}
              className="bg-card border border-border rounded-2xl p-4 text-center"
            >
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
                {icon}
              </div>
              <div className="text-xl font-black" style={{ color }}>{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs (no leaderboard) ── */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit mb-6">
          {(["badges", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t === "badges" && "🏅 "}
              {t === "history" && "📅 "}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Badge Wall ── */}
          {tab === "badges" && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Badge Collection</h2>
                <span className="text-sm text-muted-foreground">{unlockedCount} of {mockBadges.length} earned</span>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-semibold">Level {mockUser.level} Progress</span>
                  <span className="text-muted-foreground">{mockUser.points} / {nextLevel?.minPoints ?? mockUser.points} XP</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${levelPct}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full progress-eco"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {nextLevel ? `${nextLevel.minPoints - mockUser.points} XP until ${nextLevel.title}` : "Max level reached!"}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {mockBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Recent History Timeline ── */}
          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Recent Submissions
              </h2>

              {footprintHistory.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-semibold">No submissions yet</p>
                  <p className="text-sm mt-1">Complete the footprint form to see your history here.</p>
                </div>
              ) : (
                <>
                  {/* Sparkline from real data */}
                  {footprintHistory.length > 1 && (
                    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">Your Footprint Trend</p>
                          <p className="text-xs text-muted-foreground">{footprintHistory.length} submissions recorded</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-[#4CD964]">
                            {footprintHistory[footprintHistory.length - 1].total?.toFixed(1)}t
                          </div>
                          <div className="text-xs text-muted-foreground">latest total</div>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={80}>
                        <LineChart data={[...footprintHistory].reverse().map(e => ({ v: e.total }))}>
                          <Line type="monotone" dataKey="v" stroke="#4CD964" strokeWidth={2.5} dot={{ r: 3, fill: "#4CD964" }} />
                          <Tooltip formatter={(v: number | undefined) => [`${v?.toFixed(1) ?? "0.0"}t`, "Footprint"]} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="relative pl-8">
                    <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#4CD964] to-[#0B3B2A] opacity-30" />
                    <div className="space-y-4">
                      {footprintHistory.map((entry, i) => (
                        <motion.div
                          key={entry.timestamp || i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="relative"
                        >
                          <div className={`absolute -left-5 top-4 w-3 h-3 rounded-full border-2 bg-background ${i === 0 ? "border-[#4CD964]" : "border-[#6BAA75]"}`} />
                          <div className="bg-card border border-border rounded-2xl p-4 hover:border-[#6BAA75] transition-colors group">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  {i === 0 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4CD964]/20 text-[#4CD964] border border-[#4CD964]/30">
                                      Latest
                                    </span>
                                  )}
                                  <p className="font-semibold text-sm">
                                    {entry.userName || entry.userEmail?.split("@")[0] || "You"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{entry.timestamp ? timeAgo(entry.timestamp) : "Recent"}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-black text-lg text-foreground">{Number(entry.total).toFixed(1)}t</div>
                                <div className="text-xs text-muted-foreground">CO₂/year</div>
                              </div>
                            </div>

                            {/* Category mini-bars */}
                            <div className="mt-3 grid grid-cols-4 gap-2">
                              {[
                                { label: "🚗", key: "transport", color: "#2D7D4A" },
                                { label: "⚡", key: "energy", color: "#6BAA75" },
                                { label: "🥗", key: "diet", color: "#8B5A2B" },
                                { label: "♻️", key: "waste", color: "#0B3B2A" },
                              ].map(({ label, key, color }) => (
                                <div key={key} className="text-center">
                                  <div className="text-sm">{label}</div>
                                  <div className="text-xs font-semibold" style={{ color }}>
                                    {Number(entry[key]).toFixed(1)}t
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>View in dashboard</span>
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
