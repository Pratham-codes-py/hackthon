"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import AIChat from "@/components/dashboard/AIChat";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export default function SuggestionsPage() {
  const [footprint, setFootprint] = useState<any>(null);
  const [savedHabit, setSavedHabit] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const email = localStorage.getItem("userEmail");
      if (!email) { router.replace("/"); return; }

      // Load habit — Firestore first, localStorage fallback
      let habit = localStorage.getItem("habitDescription") || "";
      try {
        const habSnap = await getDoc(doc(db, "userHabits", email));
        if (habSnap.exists()) {
          habit = habSnap.data()?.habitDescription ?? habit;
          localStorage.setItem("habitDescription", habit);
        }
      } catch { /* ignore */ }
      setSavedHabit(habit);

      // Load footprint
      try {
        const raw = localStorage.getItem("latestFootprint");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.total) { setFootprint(parsed); return; }
        }
      } catch { /* ignore */ }
      setFootprint({ transport: 4.5, energy: 3.2, diet: 2.1, waste: 0.8, total: 10.6 });
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="pt-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#6BAA75]/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#6BAA75] dark:text-[#4CD964]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#6BAA75] dark:text-[#4CD964]">AI-Powered</span>
          </div>
          <h1 className="text-3xl font-black">🌱 AI Carbon Coach</h1>
          <p className="text-muted-foreground mt-1">
            Ask anything about your footprint, daily habits, diet, transport, or lifestyle.
          </p>
        </div>

        {/* Full-width chatbot */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Sparkles className="w-4 h-4 text-[#6BAA75] dark:text-[#4CD964]" />
            <h2 className="font-bold text-sm">Ask Your AI Carbon Coach</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-1">Gemini</span>
            {savedHabit && (
              <span className="ml-auto text-xs text-[#4CD964] bg-[#4CD964]/10 px-2 py-0.5 rounded-full">
                habit context active ✓
              </span>
            )}
          </div>
          <AIChat footprint={footprint} habitDescription={savedHabit} />
        </div>
      </div>
    </div>
  );
}
