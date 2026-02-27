"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car, Home, Utensils, Recycle, ArrowRight, ArrowLeft,
  Leaf, SkipForward, Info, Zap, Plane, Train,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import {
  DIET_OPTIONS, HEATING_OPTIONS, RECYCLING_OPTIONS,
  CARBON_FACTORS, FUN_FACTS,
} from "@/lib/constants";
import type { FootprintInputData } from "@/lib/types";

const STEPS = [
  { id: 0, label: "Transport", icon: Car, color: "#2D7D4A" },
  { id: 1, label: "Home", icon: Home, color: "#6BAA75" },
  { id: 2, label: "Diet", icon: Utensils, color: "#8B5A2B" },
  { id: 3, label: "Waste", icon: Recycle, color: "#0B3B2A" },
];

const defaultData: FootprintInputData = {
  transport: { carMilesPerWeek: 100, transitRidesPerWeek: 2, flightsPerYear: 2 },
  energy: { kwhPerMonth: 700, heatingType: "natural_gas" },
  diet: { type: "average" },
  waste: { recyclingFrequency: "sometimes", composting: false },
};

function calculateTransportCO2(t: FootprintInputData["transport"]) {
  return ((t.carMilesPerWeek * 52 * CARBON_FACTORS.car / 1000) +
    (t.transitRidesPerWeek * 52 * 5 * CARBON_FACTORS.transit / 1000) +
    (t.flightsPerYear * CARBON_FACTORS.flight / 1000));
}

function calculateEnergyCO2(e: FootprintInputData["energy"]) {
  const elec = e.kwhPerMonth * 12 * CARBON_FACTORS.electricity / 1000;
  const heat = e.heatingType === "natural_gas" ? 2.0 : e.heatingType === "oil" ? 2.5 : e.heatingType === "electric" ? 0.5 : 0.1;
  return elec + heat;
}

function calculateDietCO2(d: FootprintInputData["diet"]) {
  const map: Record<string, number> = {
    meat_lover: CARBON_FACTORS.meatLover,
    average: CARBON_FACTORS.average,
    vegetarian: CARBON_FACTORS.vegetarian,
    vegan: CARBON_FACTORS.vegan,
  };
  return map[d.type] ?? 2.5;
}

function calculateWasteCO2(w: FootprintInputData["waste"]) {
  const base = w.recyclingFrequency === "always" ? CARBON_FACTORS.recyclingAlways
    : w.recyclingFrequency === "sometimes" ? CARBON_FACTORS.recyclingSometimes
      : CARBON_FACTORS.recyclingNever;
  return base + (w.composting ? CARBON_FACTORS.composting : 0);
}

// Step 1: Transport
function TransportStep({ data, onChange }: { data: FootprintInputData["transport"]; onChange: (d: FootprintInputData["transport"]) => void }) {
  const co2 = calculateTransportCO2(data);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.div
          animate={{ x: [0, (data.carMilesPerWeek / 500) * 40 - 20, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-4xl mb-2"
        >
          🚗
        </motion.div>
        <h2 className="text-2xl font-bold">How do you get around?</h2>
        <p className="text-muted-foreground text-sm mt-1">Tell us about your typical transportation habits</p>
      </div>

      <div className="space-y-6">
        {/* Car */}
        <div className="bg-muted/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#6BAA75]" />
              <Label className="font-semibold">Car Miles per Week</Label>
            </div>
            <span className="text-2xl font-black text-[#6BAA75] dark:text-[#4CD964]">{data.carMilesPerWeek}</span>
          </div>
          {/* Road animation */}
          <div className="relative h-6 bg-gray-300 dark:bg-gray-700 rounded-full mb-3 overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-[#6BAA75] dark:bg-[#4CD964] rounded-full transition-all duration-300" style={{ width: `${(data.carMilesPerWeek / 500) * 100}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 text-sm" style={{ left: `${Math.min((data.carMilesPerWeek / 500) * 100, 90)}%` }}>🚗</div>
          </div>
          <Slider
            value={[data.carMilesPerWeek]}
            onValueChange={([v]) => onChange({ ...data, carMilesPerWeek: v })}
            min={0} max={500} step={10}
            className="[&_.slider-thumb]:bg-[#6BAA75]"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0 miles</span><span>500 miles</span>
          </div>
        </div>

        {/* Transit */}
        <div className="bg-muted/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Train className="w-4 h-4 text-[#6BAA75]" />
              <Label className="font-semibold">Public Transit Rides / Week</Label>
            </div>
            <span className="text-2xl font-black text-[#6BAA75] dark:text-[#4CD964]">{data.transitRidesPerWeek}</span>
          </div>
          <Slider
            value={[data.transitRidesPerWeek]}
            onValueChange={([v]) => onChange({ ...data, transitRidesPerWeek: v })}
            min={0} max={30} step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Never</span><span>30 rides/week</span>
          </div>
        </div>

        {/* Flights */}
        <div className="bg-muted/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-[#6BAA75]" />
              <Label className="font-semibold">Flights per Year</Label>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onChange({ ...data, flightsPerYear: Math.max(0, data.flightsPerYear - 1) })} className="w-8 h-8 rounded-full bg-muted hover:bg-[#6BAA75]/20 font-bold transition-colors">-</button>
              <span className="text-2xl font-black text-[#6BAA75] dark:text-[#4CD964] w-8 text-center">{data.flightsPerYear}</span>
              <button onClick={() => onChange({ ...data, flightsPerYear: Math.min(50, data.flightsPerYear + 1) })} className="w-8 h-8 rounded-full bg-muted hover:bg-[#6BAA75]/20 font-bold transition-colors">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Live estimate */}
      <div className="bg-[#0B3B2A] dark:bg-[#1A3D2E] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-sm">Transport footprint</span>
          <span className="text-2xl font-black text-[#4CD964]">{co2.toFixed(1)} tons/year</span>
        </div>
        <div className="mt-2 flex items-start gap-2 text-xs text-white/50">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{FUN_FACTS.transport}</span>
        </div>
      </div>
    </div>
  );
}

// Step 2: Energy
function EnergyStep({ data, onChange }: { data: FootprintInputData["energy"]; onChange: (d: FootprintInputData["energy"]) => void }) {
  const co2 = calculateEnergyCO2(data);
  const fillPct = Math.min((data.kwhPerMonth / 2000) * 100, 100);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-4xl mb-2">⚡</motion.div>
        <h2 className="text-2xl font-bold">Power your home</h2>
        <p className="text-muted-foreground text-sm mt-1">Tell us about your home energy consumption</p>
      </div>

      <div className="space-y-6">
        {/* Electricity */}
        <div className="bg-muted/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#6BAA75]" />
              <Label className="font-semibold">Electricity Usage</Label>
            </div>
            <span className="text-2xl font-black text-[#6BAA75] dark:text-[#4CD964]">{data.kwhPerMonth} kWh/mo</span>
          </div>

          {/* Dial / meter */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="#6BAA75" strokeWidth="8"
                  strokeDasharray={`${fillPct * 2.01} 201`}
                  className="transition-all duration-500" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#6BAA75]" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Average US home: 900 kWh/month</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#6BAA75] to-[#4CD964] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((data.kwhPerMonth / 1800) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          <Slider
            value={[data.kwhPerMonth]}
            onValueChange={([v]) => onChange({ ...data, kwhPerMonth: v })}
            min={0} max={2000} step={50}
          />
        </div>

        {/* Heating */}
        <div className="bg-muted/40 rounded-2xl p-5">
          <Label className="font-semibold mb-3 block">Heating Type</Label>
          <div className="grid grid-cols-2 gap-3">
            {HEATING_OPTIONS.map((h) => (
              <button
                key={h.id}
                onClick={() => onChange({ ...data, heatingType: h.id })}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${data.heatingType === h.id
                  ? "border-[#6BAA75] bg-[#6BAA75]/10 dark:border-[#4CD964] dark:bg-[#4CD964]/10"
                  : "border-border hover:border-[#6BAA75]/50"
                  }`}
              >
                <div className="text-xl mb-1">{h.emoji}</div>
                <div className="font-medium text-sm">{h.label}</div>
                <div className="text-xs text-muted-foreground">{h.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0B3B2A] dark:bg-[#1A3D2E] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-sm">Energy footprint</span>
          <span className="text-2xl font-black text-[#4CD964]">{co2.toFixed(1)} tons/year</span>
        </div>
        <div className="mt-2 flex items-start gap-2 text-xs text-white/50">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{FUN_FACTS.energy}</span>
        </div>
      </div>
    </div>
  );
}

// Step 3: Diet
function DietStep({ data, onChange }: { data: FootprintInputData["diet"]; onChange: (d: FootprintInputData["diet"]) => void }) {
  const co2 = calculateDietCO2(data);
  const selected = DIET_OPTIONS.find((d) => d.id === data.type) ?? DIET_OPTIONS[1];

  // Plate fill colors based on diet
  const plateFills: Record<string, string[]> = {
    meat_lover: ["#ef4444", "#dc2626", "#b91c1c"],
    average: ["#ef4444", "#f59e0b", "#22c55e"],
    vegetarian: ["#22c55e", "#86efac", "#bbf7d0"],
    vegan: ["#4CD964", "#86efac", "#d1fae5"],
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-4xl mb-2">🍽️</motion.div>
        <h2 className="text-2xl font-bold">What's on your plate?</h2>
        <p className="text-muted-foreground text-sm mt-1">Your diet is one of the most impactful choices you can make</p>
      </div>

      {/* Interactive plate */}
      <div className="flex justify-center">
        <div className="relative w-40 h-40">
          <div className="absolute inset-0 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700 shadow-inner overflow-hidden">
            {(plateFills[data.type] ?? plateFills.average).map((color, i) => (
              <motion.div
                key={`${data.type}-${i}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="absolute rounded-full"
                style={{
                  backgroundColor: color,
                  width: `${70 - i * 18}%`,
                  height: `${70 - i * 18}%`,
                  top: `${15 + i * 9}%`,
                  left: `${15 + i * 9}%`,
                  opacity: 0.7 + i * 0.1,
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center text-4xl z-10">
              {selected.emoji}
            </div>
          </div>
        </div>
      </div>

      {/* Diet buttons */}
      <div className="grid grid-cols-2 gap-4">
        {DIET_OPTIONS.map((opt) => (
          <motion.button
            key={opt.id}
            onClick={() => onChange({ type: opt.id })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${data.type === opt.id
              ? "border-[#6BAA75] dark:border-[#4CD964] shadow-md"
              : "border-border hover:border-[#6BAA75]/50"
              }`}
            style={data.type === opt.id ? { backgroundColor: `${opt.color}15` } : {}}
          >
            <div className="text-2xl mb-1">{opt.emoji}</div>
            <div className="font-bold text-sm">{opt.label}</div>
            <div className="text-xs text-muted-foreground">{opt.description}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: opt.color }}>{opt.co2} tons CO₂/yr</div>
          </motion.button>
        ))}
      </div>

      <div className="bg-[#0B3B2A] dark:bg-[#1A3D2E] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-sm">Diet footprint</span>
          <span className="text-2xl font-black text-[#4CD964]">{co2.toFixed(1)} tons/year</span>
        </div>
        <div className="mt-2 flex items-start gap-2 text-xs text-white/50">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{FUN_FACTS.diet}</span>
        </div>
      </div>
    </div>
  );
}

// Step 4: Waste
function WasteStep({ data, onChange }: { data: FootprintInputData["waste"]; onChange: (d: FootprintInputData["waste"]) => void }) {
  const co2 = calculateWasteCO2(data);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="text-4xl mb-2">♻️</motion.div>
        <h2 className="text-2xl font-bold">Your waste habits</h2>
        <p className="text-muted-foreground text-sm mt-1">How you handle waste affects your footprint significantly</p>
      </div>

      {/* Recycling bins */}
      <div>
        <Label className="font-semibold mb-4 block">How often do you recycle?</Label>
        <div className="grid grid-cols-3 gap-4">
          {RECYCLING_OPTIONS.map((opt) => (
            <motion.button
              key={opt.id}
              onClick={() => onChange({ ...data, recyclingFrequency: opt.id })}
              whileHover={{ y: -4 }}
              className={`p-4 rounded-2xl border-2 text-center transition-all duration-200 ${data.recyclingFrequency === opt.id
                ? "border-current shadow-lg"
                : "border-border opacity-60 hover:opacity-90"
                }`}
              style={data.recyclingFrequency === opt.id ? { borderColor: opt.color, backgroundColor: `${opt.color}15` } : {}}
            >
              {/* Animated bin */}
              <div className="text-3xl mb-2">{opt.emoji}</div>
              <div className="relative h-16 w-10 mx-auto mb-2">
                {/* Bin body */}
                <div className="absolute bottom-0 left-0 right-0 rounded-b-lg border-2 border-current transition-all duration-500"
                  style={{ borderColor: opt.color, height: data.recyclingFrequency === opt.id ? "100%" : "60%", backgroundColor: `${opt.color}20` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: opt.color, opacity: 0.5 }} />
                  </div>
                </div>
                {/* Bin lid */}
                <div className="absolute top-0 left-[-2px] right-[-2px] h-2 rounded-sm" style={{ backgroundColor: opt.color, opacity: 0.8 }} />
              </div>
              <div className="font-semibold text-sm" style={{ color: opt.color }}>{opt.label}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Composting */}
      <div className="bg-muted/40 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={data.composting ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="text-2xl">🪱</span>
            </motion.div>
            <div>
              <Label className="font-semibold">I compost food scraps</Label>
              <p className="text-xs text-muted-foreground">Diverts waste from landfill, reducing methane</p>
            </div>
          </div>
          <Switch
            checked={data.composting}
            onCheckedChange={(v) => onChange({ ...data, composting: v })}
            className="data-[state=checked]:bg-[#6BAA75]"
          />
        </div>
        {data.composting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 text-xs text-[#6BAA75] dark:text-[#4CD964] font-medium"
          >
            ✓ Great choice! You're saving ~0.05 tons CO₂ per year by composting
          </motion.div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div>
            <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">Did you know?</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{FUN_FACTS.waste}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#0B3B2A] dark:bg-[#1A3D2E] rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-sm">Waste footprint</span>
          <span className="text-2xl font-black text-[#4CD964]">{co2.toFixed(1)} tons/year</span>
        </div>
        <div className="mt-2 flex items-start gap-2 text-xs text-white/50">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Average US household generates ~4.4 lbs of trash per day</span>
        </div>
      </div>
    </div>
  );
}

// Main Input Page Component
export default function InputPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<FootprintInputData>(defaultData);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confettiParticles, setConfettiParticles] = useState<Array<{ id: number; color: string; left: number; rotate: number; x: number; duration: number; delay: number }>>([]);
  const router = useRouter();

  // Generate confetti particles only on client side
  useEffect(() => {
    if (showConfetti) {
      setConfettiParticles(
        Array.from({ length: 30 }, (_, i) => ({
          id: i,
          color: ["#4CD964", "#6BAA75", "#0B3B2A", "#8B5A2B", "#fff"][i % 5],
          left: Math.random() * 100,
          rotate: Math.random() * 720,
          x: (Math.random() - 0.5) * 200,
          duration: 2 + Math.random() * 2,
          delay: Math.random() * 0.5,
        }))
      );
    }
  }, [showConfetti]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  // Calculate total CO2
  const totalCO2 = calculateTransportCO2(data.transport) +
    calculateEnergyCO2(data.energy) +
    calculateDietCO2(data.diet) +
    calculateWasteCO2(data.waste);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Read the user session saved by Firebase Google Sign-In
      const userEmail = localStorage.getItem("userEmail");
      const userName = localStorage.getItem("userName") || "User";

      if (!userEmail) {
        setIsSubmitting(false);
        setErrorMsg("You must be logged in to save your footprint.");
        return;
      }

      // Build the footprint entry
      const footprintEntry = {
        userEmail,
        userName,
        transport: calculateTransportCO2(data.transport),
        energy: calculateEnergyCO2(data.energy),
        diet: calculateDietCO2(data.diet),
        waste: calculateWasteCO2(data.waste),
        total: totalCO2,
        timestamp: new Date().toISOString(),
        rawData: data,
      };

      // --- Save to Firestore ---
      const { db } = await import("@/lib/firebase/config");
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

      await addDoc(collection(db, "footprints"), {
        ...footprintEntry,
        createdAt: serverTimestamp(),
      });

      // --- Also keep a localStorage copy so Dashboard/AI suggestions work instantly ---
      const existingHistory = JSON.parse(localStorage.getItem("footprintHistory") || "[]");
      existingHistory.push(footprintEntry);
      localStorage.setItem("footprintHistory", JSON.stringify(existingHistory));
      localStorage.setItem("latestFootprint", JSON.stringify(footprintEntry));

      setIsSubmitting(false);
      setShowConfetti(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);

    } catch (err: any) {
      console.error("Error saving footprint:", err);
      setErrorMsg(err.message || "Failed to save footprint data.");
      setIsSubmitting(false);
    }
  };

  const stepComponents = [
    <TransportStep key="transport" data={data.transport} onChange={(t) => setData({ ...data, transport: t })} />,
    <EnergyStep key="energy" data={data.energy} onChange={(e) => setData({ ...data, energy: e })} />,
    <DietStep key="diet" data={data.diet} onChange={(d) => setData({ ...data, diet: d })} />,
    <WasteStep key="waste" data={data.waste} onChange={(w) => setData({ ...data, waste: w })} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B3B2A]/80 backdrop-blur-sm"
          >
            <div className="text-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-8xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-black text-[#4CD964]">Footprint Calculated!</h2>
              <p className="text-white/70 mt-2">Your total: <span className="font-bold text-white">{totalCO2.toFixed(1)} tons CO₂/year</span></p>
              <p className="text-white/50 text-sm mt-1">Taking you to your dashboard...</p>
            </div>
            {/* Confetti particles */}
            {confettiParticles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-2 h-2 rounded-sm"
                style={{
                  backgroundColor: particle.color,
                  left: `${particle.left}%`,
                  top: `-10px`,
                }}
                animate={{ y: "110vh", rotate: particle.rotate, x: particle.x }}
                transition={{ duration: particle.duration, delay: particle.delay }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Step {currentStep + 1} of {STEPS.length}</span>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#6BAA75] transition-colors"
            >
              <SkipForward className="w-3 h-3" /> Skip to Dashboard
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.button
                      onClick={() => i <= currentStep && setCurrentStep(i)}
                      whileHover={i <= currentStep ? { scale: 1.1 } : {}}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${i === currentStep
                        ? "bg-[#6BAA75] dark:bg-[#4CD964] text-white dark:text-[#0A1F18] shadow-lg"
                        : i < currentStep
                          ? "bg-[#0B3B2A] text-white"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.button>
                    <span className={`text-xs font-medium ${i === currentStep ? "text-[#6BAA75] dark:text-[#4CD964]" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${i < currentStep ? "bg-[#6BAA75]" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6BAA75] to-[#4CD964] rounded-full"
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Form card */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {stepComponents[currentStep]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="rounded-full px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {/* Running total */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Running total</div>
            <div className="font-bold text-[#6BAA75] dark:text-[#4CD964]">{totalCO2.toFixed(1)} tCO₂e/yr</div>
            {errorMsg && <div className="text-xs text-red-500 mt-1 max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis" title={errorMsg}>{errorMsg}</div>}
          </div>

          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="rounded-full px-6 bg-[#6BAA75] dark:bg-[#4CD964] hover:bg-[#5a9964] dark:hover:bg-[#3bc454] text-white dark:text-[#0A1F18] font-semibold shadow-lg"
          >
            {isSubmitting ? (
              <>Saving... <div className="w-4 h-4 ml-2 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
            ) : currentStep === STEPS.length - 1 ? (
              <>Calculate <Leaf className="w-4 h-4 ml-2" /></>
            ) : (
              <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
