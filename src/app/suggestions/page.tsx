"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Brain, FlaskConical, ChevronRight, Check,
  Lightbulb, Clock, Zap, Leaf,
  CheckSquare, RefreshCw, TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import { mockAISuggestions } from "@/lib/mock-data";
import type { AISuggestion } from "@/lib/types";
import Link from "next/link";
import AIChat from "@/components/dashboard/AIChat";

const CATEGORY_COLORS: Record<string, string> = {
  transport: "#2D7D4A",
  energy: "#6BAA75",
  diet: "#8B5A2B",
  waste: "#0B3B2A",
  lifestyle: "#4CD964",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  transport: "🚗",
  energy: "⚡",
  diet: "🥗",
  waste: "♻️",
  lifestyle: "🌱",
};

const DIFFICULTY_CONFIG: Record<string, { color: string; dots: number; label: string }> = {
  easy: { color: "#4CD964", dots: 1, label: "Easy" },
  medium: { color: "#f59e0b", dots: 2, label: "Medium" },
  hard: { color: "#ef4444", dots: 3, label: "Hard" },
};

// Flippable suggestion card
function SuggestionCard({ suggestion, onToggle, index }: { suggestion: AISuggestion; onToggle: (id: string) => void; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const color = CATEGORY_COLORS[suggestion.category] || "#6BAA75";
  const diff = DIFFICULTY_CONFIG[suggestion.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="card-flip-container h-72"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div className={`card-flip-inner h-full w-full ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>

        {/* Front */}
        <div className="card-flip-front h-full bg-card border border-border rounded-2xl p-5 flex flex-col group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">{CATEGORY_ICONS[suggestion.category]}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
                SAVE {suggestion.savingsPerYear.toFixed(1)}t
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onToggle(suggestion.id); }}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${suggestion.selected
                  ? "border-[#4CD964] bg-[#4CD964]"
                  : "border-border hover:border-[#6BAA75]"
                  }`}
              >
                {suggestion.selected && <Check className="w-3.5 h-3.5 text-white dark:text-[#0A1F18]" />}
              </motion.button>
            </div>
          </div>

          <h3 className="font-bold text-base mb-1.5">{suggestion.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{suggestion.shortDescription}</p>

          <div className="mt-auto pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < diff.dots ? "" : "opacity-20"}`} style={{ backgroundColor: i < diff.dots ? diff.color : "var(--muted)" }} />
                  ))}
                </div>
                <span>{diff.label}</span>
              </div>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {suggestion.timeToImplement}
              </span>
              <span className="text-[#6BAA75] dark:text-[#4CD964] font-medium">Hover →</span>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="card-flip-back h-full bg-gradient-to-br from-[#0B3B2A] to-[#2D7D4A] rounded-2xl p-5 flex flex-col text-white overflow-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20">
              <Lightbulb className="w-4 h-4 text-[#4CD964]" />
            </div>
            <h3 className="font-bold text-sm">{suggestion.title}</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed flex-1">{suggestion.whyItWorks}</p>
          <div className="mt-auto pt-3 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-white/60">Annual savings</span>
            <span className="font-black text-[#4CD964] text-base">{suggestion.savingsPerYear.toFixed(1)}t CO₂</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Refined suggestion card
function RefinedCard({ title, description, savings }: { title: string; description: string; savings: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card border border-[#4CD964]/30 rounded-2xl p-4 flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-xl bg-[#4CD964]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Zap className="w-4 h-4 text-[#4CD964]" />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-sm">{title}</h4>
          <span className="text-xs font-bold text-[#4CD964] whitespace-nowrap">-{savings}t/yr</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-[#6BAA75] dark:text-[#4CD964] whitespace-nowrap">
        <Sparkles className="w-3 h-3" />
        <span>AI-adapted to your choices</span>
      </div>
    </motion.div>
  );
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<(AISuggestion & { selected?: boolean })[]>([]);
  const [showRefined, setShowRefined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [footprint, setFootprint] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    async function loadDataAndFetchSuggestions() {
      try {
        // Guard 1: must be logged in
        const email = localStorage.getItem("userEmail");
        if (!email) {
          router.replace("/");
          return;
        }

        // Guard 2: must have completed the form
        const latestStr = localStorage.getItem("latestFootprint");
        if (!latestStr) {
          router.replace("/input");
          return;
        }

        let footprintData = { transport: 4.5, energy: 3.2, diet: 2.1, waste: 0.8, total: 10.6 };
        try {
          const parsed = JSON.parse(latestStr);
          if (parsed && parsed.total) footprintData = parsed;
        } catch (e) {
          console.error("Failed to parse latestFootprint from local storage", e);
        }

        setFootprint(footprintData);

        const res = await fetch("/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(footprintData),
        });

        const result = await res.json();

        if (!res.ok) {
          if (result.fallbackSuggestions) {
            setSuggestions(result.fallbackSuggestions.map((s: string, i: number) => ({
              id: `fallback-${i}`,
              title: `AI Suggestion ${i + 1}`,
              category: ["transport", "energy", "diet"][i % 3],
              difficulty: "medium",
              impact: "medium",
              savingsPerYear: 0.5,
              shortDescription: s,
              whyItWorks: "Actionable step to lower carbon footprint.",
              timeToImplement: "1 week",
              costSavingsPerYear: 50,
              selected: false
            })));
          } else {
            throw new Error(result.error || "Failed to fetch suggestions");
          }
        } else {
          setSuggestions(result.suggestions.map((s: any, i: number) => ({
            id: `ai-${i}`,
            title: s.title,
            category: ["transport", "energy", "diet"][i % 3],
            difficulty: s.difficulty?.toLowerCase() || "medium",
            impact: "medium",
            savingsPerYear: parseFloat(s.impact) || 0.5,
            shortDescription: s.description,
            whyItWorks: "AI-generated recommendation based on your specific footprint.",
            timeToImplement: "Ongoing",
            costSavingsPerYear: 0,
            selected: false
          })));
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load AI suggestions.");
      } finally {
        setLoading(false);
      }
    }

    loadDataAndFetchSuggestions();
  }, []);

  const selectedCount = suggestions.filter((s) => s.selected).length;
  const totalSavings = suggestions.filter((s) => s.selected).reduce((acc, s) => acc + s.savingsPerYear, 0);

  const handleToggle = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleSelectAll = () => {
    const allSelected = suggestions.length > 0 && suggestions.every((s) => s.selected);
    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: !allSelected })));
  };

  const handleRefine = () => {
    setShowRefined(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="pt-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="w-10 h-10 rounded-xl bg-[#6BAA75]/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#6BAA75] dark:text-[#4CD964]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#6BAA75] dark:text-[#4CD964]">AI-Powered</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black"
          >
            🌱 Personalized Recommendations
          </motion.h1>
          <p className="text-muted-foreground mt-1">Tailored to your footprint profile. Chat with your AI coach below, then explore strategy cards.</p>
        </div>

        {/* ── AI Chat at the Top ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6BAA75] dark:text-[#4CD964]" />
            <span>Ask Your AI Carbon Coach</span>
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Powered by Gemini</span>
          </h2>
          <AIChat footprint={footprint} />
        </motion.div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Strategy Cards</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Cards + Sidebar below ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cards grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold">Available Strategies</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll} className="rounded-full text-xs">
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                  {suggestions.every((s) => s.selected) ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleRefine}
                  disabled={selectedCount < 2}
                  className="rounded-full text-xs bg-[#6BAA75] dark:bg-[#4CD964] text-white dark:text-[#0A1F18] hover:opacity-90"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  AI Refine
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-72 bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-2xl p-6 text-center">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {suggestions.map((s, i) => (
                  <SuggestionCard key={s.id} suggestion={s} onToggle={handleToggle} index={i} />
                ))}
              </div>
            )}

            {/* AI Refinement section */}
            <AnimatePresence>
              {showRefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[#4CD964]" />
                    <h2 className="font-bold">AI-Refined Suggestions</h2>
                    <span className="text-xs bg-[#4CD964]/20 text-[#4CD964] px-2 py-0.5 rounded-full">Adapted to your choices</span>
                  </div>
                  <div className="space-y-3">
                    <RefinedCard
                      title="E-Bike for Short Trips"
                      description="Since you're reducing car use, an e-bike for trips under 5 miles would complement your transit strategy perfectly."
                      savings={0.5}
                    />
                    <RefinedCard
                      title="Batch Cooking for Meal Prep"
                      description="Pairing plant-based Mondays with meal prep reduces food waste by 40% and amplifies your diet changes."
                      savings={0.12}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Selected panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* My Plan */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-[#6BAA75]" /> My Reduction Plan
                </h3>

                {selectedCount === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="text-sm">Select strategies to build your plan</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestions.filter((s) => s.selected).map((s) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#4CD964]/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-[#4CD964]" />
                        </div>
                        <span className="flex-1 text-xs">{s.title}</span>
                        <span className="text-xs font-semibold text-[#6BAA75] dark:text-[#4CD964]">-{s.savingsPerYear}t</span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {selectedCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Total savings</span>
                      <span className="text-xl font-black text-[#4CD964]">-{totalSavings.toFixed(1)}t/yr</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">
                      ≈ {Math.round(totalSavings * 50)} trees planted worth of impact
                    </div>
                    <Link href="/simulation">
                      <Button className="w-full rounded-xl bg-[#0B3B2A] dark:bg-[#4CD964] hover:opacity-90 text-white dark:text-[#0A1F18] font-semibold flex items-center gap-2">
                        <FlaskConical className="w-4 h-4" />
                        Simulate My Future
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Category filter */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-sm mb-3">Filter by Category</h3>
                <div className="flex flex-wrap gap-2">
                  {["All", "Transport", "Energy", "Diet", "Waste"].map((cat) => (
                    <button
                      key={cat}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${cat === "All"
                        ? "bg-[#6BAA75] dark:bg-[#4CD964] text-white dark:text-[#0A1F18]"
                        : "bg-muted text-muted-foreground hover:bg-[#6BAA75]/10 hover:text-foreground"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact summary */}
              <div className="bg-gradient-to-br from-[#0B3B2A] to-[#2D7D4A] rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-[#4CD964]" />
                  <span className="font-semibold text-sm">Potential Impact</span>
                </div>
                <div className="text-3xl font-black text-[#4CD964] mb-1">
                  {suggestions.reduce((a, s) => a + s.savingsPerYear, 0).toFixed(1)}t
                </div>
                <p className="text-white/60 text-xs">Max possible annual reduction if all strategies adopted</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
