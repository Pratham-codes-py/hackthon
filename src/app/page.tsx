"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Leaf, Brain, Trophy, Sparkles, ChevronRight,
  Globe, BarChart3, Zap, Award, ArrowRight, Star,
  CheckCircle2, Users, TrendingDown, Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { mockPartners } from "@/lib/mock-data";
import { LoginModal } from "@/components/auth/LoginModal";

// Animated counter component
function AnimatedCounter({ end, duration = 2, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// Globe SVG Animation
function AnimatedGlobe() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
          <defs>
            <radialGradient id="globeGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#6BAA75" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0B3B2A" stopOpacity="0.3" />
            </radialGradient>
          </defs>
          {/* Latitude lines */}
          {[30, 60, 90, 120, 150].map((y) => (
            <ellipse key={y} cx="100" cy={y} rx="90" ry="12" fill="none" stroke="#6BAA75" strokeWidth="0.5" opacity="0.6" />
          ))}
          {/* Longitude lines */}
          {[0, 30, 60, 90, 120, 150].map((angle) => (
            <ellipse key={angle} cx="100" cy="100" rx="12" ry="90" fill="none" stroke="#6BAA75" strokeWidth="0.5" opacity="0.6"
              transform={`rotate(${angle} 100 100)`} />
          ))}
        </svg>
      </motion.div>

      {/* Main globe */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10"
      >
        <div className="w-48 h-48 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-[#6BAA75] via-[#2D7D4A] to-[#0B3B2A] shadow-2xl flex items-center justify-center relative overflow-hidden">
          {/* Continents suggestion */}
          <div className="absolute top-8 left-10 w-16 h-12 bg-[#4CD964]/30 rounded-2xl rotate-12" />
          <div className="absolute top-16 right-6 w-20 h-16 bg-[#4CD964]/20 rounded-3xl -rotate-6" />
          <div className="absolute bottom-10 left-14 w-24 h-10 bg-[#4CD964]/25 rounded-full rotate-3" />
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full border-2 border-[#4CD964]/30" />
          <div className="absolute inset-[-4px] rounded-full border border-[#4CD964]/15" />
          <Globe className="w-20 h-20 md:w-32 md:h-32 text-white/90 relative z-10" />
        </div>

        {/* Orbiting particles */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#4CD964]"
            style={{
              top: "50%",
              left: "50%",
              originX: "0%",
              originY: "0%",
            }}
            animate={{ rotate: [deg, deg + 360] }}
            transition={{ duration: 8 + i, repeat: Infinity, ease: "linear" }}
          >
            <div
              className="w-2 h-2 rounded-full bg-[#4CD964] opacity-70"
              style={{ transform: `translateX(${80 + i * 10}px) translateY(-1px)` }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// How It Works Step Card
function HowItWorksCard({ step, icon, title, description, details, delay }: {
  step: number; icon: React.ReactNode; title: string; description: string; details: string; delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      className="card-flip-container h-64"
    >
      <div className="card-flip-inner h-full w-full">
        {/* Front */}
        <div className="card-flip-front h-full w-full bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div className="w-8 h-1 rounded-full bg-[#6BAA75]" />
          <h3 className="font-bold text-xl">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          <span className="text-xs text-[#6BAA75] dark:text-[#4CD964] font-medium">Hover to learn more →</span>
        </div>
        {/* Back */}
        <div className="card-flip-back h-full w-full bg-gradient-to-br from-[#0B3B2A] to-[#2D7D4A] rounded-2xl p-8 flex flex-col items-center text-center gap-4 justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
            {icon}
          </div>
          <h3 className="font-bold text-xl text-white">{title}</h3>
          <p className="text-white/80 text-sm leading-relaxed">{details}</p>
          <Link href="/input">
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20 rounded-full">
              Try It Now <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Feature Card
function FeatureCard({ icon, title, description, color, delay }: {
  icon: React.ReactNode; title: string; description: string; color: string; delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(107,170,117,0.15)" }}
      className="bg-card border border-border rounded-2xl p-6 cursor-default group transition-all duration-300 glow-green-hover"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white transition-transform group-hover:scale-110`} style={{ backgroundColor: color }}>
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; top: number; duration: number; delay: number }>>([]);
  const heroRef = useRef(null);

  // Generate particles only on client side
  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 3,
      }))
    );
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── Hero Section ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0B3B2A 0%, #1A5C3C 30%, #2D7D4A 60%, #0B3B2A 100%)",
          backgroundSize: "400% 400%",
        }}
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 animate-gradient"
          style={{
            background: "linear-gradient(135deg, #0B3B2A 0%, #2D7D4A 50%, #6BAA75 100%)",
            backgroundSize: "400% 400%",
            opacity: 0.7,
          }}
        />

        {/* Leaf pattern */}
        <div className="absolute inset-0 leaf-pattern opacity-30" />

        {/* Particle dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1.5 h-1.5 rounded-full bg-[#4CD964]/30"
              style={{ left: `${particle.left}%`, top: `${particle.top}%` }}
              animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#4CD964]" />
              AI-Powered Carbon Reduction
              <span className="w-2 h-2 rounded-full bg-[#4CD964] animate-pulse" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-6"
            >
              Your Personal{" "}
              <span className="text-[#4CD964]">AI Carbon</span>
              {" "}Coach.
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white/80">
                Measure. Plan. Reduce.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg"
            >
              Join thousands of users saving the planet, one action at a time. Get personalized AI recommendations and track your progress with beautiful visualizations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              <Button
                onClick={() => setLoginOpen(true)}
                size="lg"
                className="bg-[#4CD964] hover:bg-[#3bc454] text-[#0A1F18] font-bold px-8 rounded-full shadow-lg shadow-[#4CD964]/30 hover:shadow-[#4CD964]/50 transition-all hover:scale-105"
              >
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-full backdrop-blur-sm"
                >
                  See How It Works
                </Button>
              </a>
            </motion.div>

            {/* Live Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex items-center gap-3 justify-center lg:justify-start"
            >
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm">
                <span className="text-lg">🌍</span>
                <span className="text-white/60 text-sm">Users have saved</span>
                <span className="text-[#4CD964] font-bold text-lg">
                  <AnimatedCounter end={52847} duration={2.5} /> tons CO₂
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right - Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="h-64 md:h-80 lg:h-96"
          >
            <AnimatedGlobe />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-xs">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-[#0B3B2A] dark:bg-[#0A1F18] py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: 10000, suffix: "+", label: "Active Users" },
              { value: 50000, suffix: " Tons", label: "CO₂ Saved" },
              { value: 100000, suffix: "+", label: "Actions Taken" },
            ].map(({ value, suffix, label }) => (
              <div key={label}>
                <div className="text-2xl md:text-3xl font-black text-[#4CD964]">
                  <AnimatedCounter end={value} suffix={suffix} />
                </div>
                <div className="text-white/50 text-xs md:text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6BAA75]/10 border border-[#6BAA75]/20 text-[#6BAA75] dark:text-[#4CD964] text-sm font-medium mb-4"
          >
            <CheckCircle2 className="w-4 h-4" /> Simple 3-Step Process
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-black text-foreground mb-4"
          >
            How It <span className="text-[#6BAA75] dark:text-[#4CD964]">Works</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-xl mx-auto"
          >
            From measuring your impact to earning rewards — EcoTrack AI makes sustainability actionable and engaging.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: 1, icon: <Leaf className="w-6 h-6" />, title: "Track Your Impact",
              description: "Enter your transport, energy, diet, and waste habits in our interactive wizard.",
              details: "Our multi-step wizard guides you through 4 key areas. Sliders, visual selectors, and real-time feedback make it easy and even fun to understand your current footprint.",
            },
            {
              step: 2, icon: <Brain className="w-6 h-6" />, title: "Get AI Insights",
              description: "Receive personalized recommendations from our AI based on your unique footprint.",
              details: "Our AI analyzes your footprint and generates a prioritized list of actionable strategies, ranked by impact and effort. Each suggestion includes cost savings and implementation guidance.",
            },
            {
              step: 3, icon: <Trophy className="w-6 h-6" />, title: "Reduce & Earn",
              description: "Implement strategies, track progress, and earn badges and points for every action.",
              details: "Every action you take earns points and badges. Compete on leaderboards, maintain streaks, and watch your simulation show future impact. Sustainability has never been more rewarding!",
            },
          ].map((item, i) => (
            <HowItWorksCard key={i} {...item} delay={i * 0.15} />
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-muted/30 rounded-3xl mb-24">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-black text-foreground mb-4"
          >
            Everything You Need to Go <span className="text-[#6BAA75] dark:text-[#4CD964]">Green</span>
          </motion.h2>
          <p className="text-muted-foreground">Powerful tools designed for real-world sustainability impact.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 place-items-stretch justify-items-center">
          {[
            { icon: <BarChart3 className="w-6 h-6" />, title: "Smart Calculator", description: "Accurate, science-backed carbon footprint estimation across all life areas.", color: "#2D7D4A" },
            { icon: <Sparkles className="w-6 h-6" />, title: "AI Recommendations", description: "Personalized reduction strategies that adapt to your choices and lifestyle.", color: "#6BAA75" },
            { icon: <TrendingDown className="w-6 h-6" />, title: "What-If Simulation", description: "See your future impact with interactive timelines before you commit.", color: "#0B3B2A" },
            { icon: <Award className="w-6 h-6" />, title: "Rewards & Badges", description: "Gamified sustainability journey with achievements, streaks, and leaderboards.", color: "#8B5A2B" },
          ].map((feat, i) => (
            <div key={i} className="w-full max-w-sm flex">
              <FeatureCard {...feat} delay={i * 0.1} />
            </div>
          ))}
        </div>
      </section>



      {/* ── CTA Section ── */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center rounded-3xl p-12 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0B3B2A, #2D7D4A)" }}
        >
          <div className="absolute inset-0 leaf-pattern opacity-20" />
          <div className="relative z-10">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Start Your Green Journey Today
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Join 10,000+ users who are actively reducing their carbon footprint. It's free, it's impactful, and it's rewarding.
            </p>
            <Button
              onClick={() => setLoginOpen(true)}
              size="lg"
              className="bg-[#4CD964] hover:bg-[#3bc454] text-[#0A1F18] font-bold px-10 rounded-full shadow-xl shadow-[#4CD964]/30 hover:scale-105 transition-transform"
            >
              Calculate My Footprint <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-white/40 text-xs mt-4">No credit card required. Free forever.</p>
          </div>
        </motion.div>
      </section>

      <Footer />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
