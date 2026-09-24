"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Navigation,
  ShieldCheck,
  Lock,
  MapPin,
  Car,
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
  Clock,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Animated search placeholder strings ──────────────────────────────────────
const DESTINATIONS = [
  "Take me to the airport",
  "Downtown by 9am, cheapest option",
  "Get me home after the concert",
  "An EV ride to the office",
  "Book me the fastest ride nearby",
];

// ─── Typewriter hook ────────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 26) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
}

// ─── Slide caption ──────────────────────────────────────────────────────────────
function SlideCaption({ text, accent }: { text: string; accent: string }) {
  const { displayed, done } = useTypewriter(text, 26);
  return (
    <span className="text-muted">
      {displayed}
      {!done && (
        <span
          className="inline-block w-0.5 h-[1em] ml-0.5 align-middle animate-pulse"
          style={{ background: accent }}
        />
      )}
    </span>
  );
}

// ─── Map preview ────────────────────────────────────────────────────────────────
function MapPreview() {
  return (
    <div className="relative w-full h-full bg-[#0a0f1a] rounded-2xl overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-m" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#14b8a6" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-m)" />
      </svg>

      {/* Route glow */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rg-m" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <filter id="glow-m">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Glow duplicate */}
        <path d="M 70 190 Q 140 155 200 115 Q 250 82 310 55" stroke="#14b8a6" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.25"/>
        <path d="M 70 190 Q 140 155 200 115 Q 250 82 310 55" stroke="url(#rg-m)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="7 3" className="animate-route-pulse"/>
      </svg>

      {/* Origin */}
      <div className="absolute bottom-[42%] left-[16%] flex flex-col items-center gap-1">
        <div className="w-4 h-4 rounded-full bg-teal border-2 border-white shadow-lg shadow-teal/50"/>
        <div className="px-2 py-0.5 rounded-full bg-teal/20 border border-teal/30 text-[9px] text-teal font-semibold">You</div>
      </div>

      {/* Destination */}
      <div className="absolute top-[14%] right-[16%] flex flex-col items-center gap-0.5">
        <MapPin className="w-7 h-7 text-violet" fill="#a855f7" strokeWidth={1.5}/>
        <div className="px-2 py-0.5 rounded-full bg-violet/20 border border-violet/30 text-[9px] text-violet font-semibold">Airport T2</div>
      </div>

      {/* Animated car */}
      <motion.div
        animate={{ x: [0, 35, 80, 125, 165, 210], y: [0, -18, -38, -58, -74, -92] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[43%] left-[16%]"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-indigo flex items-center justify-center shadow-xl shadow-teal/40">
          <Car className="w-4 h-4 text-white"/>
        </div>
      </motion.div>

      {/* Bottom ETA strip */}
      <div className="absolute bottom-0 left-0 right-0 glass border-t border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="text-center">
          <p className="text-[9px] text-muted uppercase tracking-wider">ETA</p>
          <p className="text-base font-bold text-foreground">4 min</p>
        </div>
        <div className="h-8 w-px bg-white/10"/>
        <div className="text-center">
          <p className="text-[9px] text-muted uppercase tracking-wider">Distance</p>
          <p className="text-base font-bold text-foreground">2.3 km</p>
        </div>
        <div className="h-8 w-px bg-white/10"/>
        <div className="text-center flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-teal"/>
          <p className="text-base font-bold text-teal">$8.40</p>
        </div>
        <div className="h-8 w-px bg-white/10"/>
        <div className="px-3 py-1.5 rounded-full bg-teal/15 border border-teal/30 text-[10px] text-teal font-semibold">
          Best deal ✓
        </div>
      </div>
    </div>
  );
}

// ─── Payment preview ────────────────────────────────────────────────────────────
function PaymentPreview() {
  return (
    <div className="relative w-full h-full bg-[#0a0f1a] rounded-2xl overflow-hidden flex flex-col p-5 gap-4">
      {/* Shield badge */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-violet/10 border border-violet/25">
        <div className="w-12 h-12 rounded-2xl bg-violet/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-violet"/>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Payment Protected</p>
          <p className="text-xs text-muted mt-0.5">Held securely · Not released yet</p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-3 h-3 rounded-full bg-violet"
        />
      </div>

      {/* Big amount */}
      <div className="flex items-baseline justify-between px-1">
        <span className="text-sm text-muted">Fare total</span>
        <span className="text-4xl font-bold text-foreground tracking-tight">$12.60</span>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2.5">
        {[
          { label: "Base fare", val: "$8.00", color: "text-foreground" },
          { label: "AI optimization saving", val: "−$1.40", color: "text-teal" },
          { label: "Service fee", val: "$2.00", color: "text-foreground" },
          { label: "Tip (optional)", val: "$4.00", color: "text-muted" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.06]">
            <span className="text-xs text-muted">{row.label}</span>
            <span className={`text-xs font-semibold ${row.color}`}>{row.val}</span>
          </div>
        ))}
      </div>

      {/* Lock strip */}
      <div className="mt-auto flex items-center gap-2.5 p-3 rounded-xl bg-teal/10 border border-teal/25">
        <Lock className="w-4 h-4 text-teal shrink-0"/>
        <p className="text-xs text-teal font-medium">Fare locked · No surge pricing after booking</p>
      </div>
    </div>
  );
}

// ─── Tracking preview ───────────────────────────────────────────────────────────
function TrackingPreview() {
  return (
    <div className="relative w-full h-full bg-[#0a0f1a] rounded-2xl overflow-hidden flex flex-col p-5 gap-4">
      {/* Driver card */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.06] border border-white/10">
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
          alt="Driver"
          className="w-12 h-12 rounded-full object-cover border-2 border-teal/30 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Daniel K.</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"/>
            <span className="text-xs text-muted">4.9 · Tesla Model 3 · <span className="text-teal">EV</span></span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-muted uppercase tracking-wide">Arriving</p>
          <motion.p
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-xl font-bold text-teal"
          >
            2 min
          </motion.p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted">
          <span>Driver approaching</span>
          <span className="text-teal font-semibold">78%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            animate={{ width: ["35%", "78%"] }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-teal to-indigo"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {[
          { Icon: Navigation, label: "Driver dispatched", state: "done" },
          { Icon: Car, label: "Approaching pickup point", state: "done" },
          { Icon: Clock, label: "Arriving in ~2 minutes", state: "active" },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              step.state === "done" ? "bg-teal/20 text-teal"
              : step.state === "active" ? "bg-indigo/20 text-indigo"
              : "bg-white/5 text-muted"
            }`}>
              <step.Icon className="w-3.5 h-3.5"/>
            </div>
            <span className={`text-xs font-medium ${
              step.state === "done" ? "text-teal"
              : step.state === "active" ? "text-foreground"
              : "text-muted"
            }`}>{step.label}</span>
            {step.state === "active" && (
              <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                className="ml-auto w-2 h-2 rounded-full bg-indigo"/>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rating preview ─────────────────────────────────────────────────────────────
function RatingPreview() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let r = 0;
      const id = setInterval(() => { r++; setRating(r); if (r === 5) clearInterval(id); }, 300);
    }, 700);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="relative w-full h-full bg-[#0a0f1a] rounded-2xl overflow-hidden flex flex-col p-5 gap-4">
      {/* Trip done card */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.06] border border-white/10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal to-indigo flex items-center justify-center shrink-0">
          <Route className="w-5 h-5 text-white"/>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Ride Complete 🎉</p>
          <p className="text-xs text-muted mt-0.5">Airport T2 · 14 min · 6.2 km</p>
        </div>
        <span className="text-xl font-bold text-teal shrink-0">$12.60</span>
      </div>

      {/* Stars */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted">How was your ride with Daniel?</p>
        <div className="flex items-center gap-3">
          {[1,2,3,4,5].map((s) => (
            <motion.button key={s} whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.85 }}
              onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}>
              <Star className={`w-9 h-9 transition-colors ${
                s <= (hovered || rating) ? "text-yellow-400 fill-yellow-400" : "text-white/15"
              }`}/>
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {rating > 0 && (
            <motion.p key={rating} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="text-sm font-semibold text-teal">
              {rating === 5 ? "Amazing ride! 🎉" : rating >= 3 ? "Thanks for your feedback" : "We'll look into this"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="mt-auto flex gap-3">
        <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-teal/10 text-teal border border-teal/25 hover:bg-teal/20 transition">
          Download receipt
        </button>
        <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-foreground border border-white/10 hover:bg-white/10 transition">
          Book again
        </button>
      </div>
    </div>
  );
}

// ─── Slide data ─────────────────────────────────────────────────────────────────
const FEATURE_SLIDES = [
  {
    id: "map", label: "AI Route Optimizer", accent: "#14b8a6",
    caption: "Scans every provider in real-time to find the fastest route and lowest fare — automatically.",
    preview: <MapPreview />,
  },
  {
    id: "payment", label: "Protected Payment", accent: "#a855f7",
    caption: "Your money is held securely and only released the moment your ride is complete.",
    preview: <PaymentPreview />,
  },
  {
    id: "tracking", label: "Live Ride Tracking", accent: "#6366f1",
    caption: "Watch your driver approach in real-time with smart ETA updates the whole journey.",
    preview: <TrackingPreview />,
  },
  {
    id: "rating", label: "Instant Ratings", accent: "#14b8a6",
    caption: "Rate your driver and download your receipt in seconds. Your full history is always saved.",
    preview: <RatingPreview />,
  },
];

// ─── Main Hero ──────────────────────────────────────────────────────────────────
export function Hero() {
  const [destIndex, setDestIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [captionKey, setCaptionKey] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setDestIndex((i) => (i + 1) % DESTINATIONS.length), 2800);
    return () => clearInterval(id);
  }, []);

  const startAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setSlideIndex((i) => (i + 1) % FEATURE_SLIDES.length);
      setCaptionKey((k) => k + 1);
    }, 5200);
  };

  useEffect(() => {
    startAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  const goTo = (idx: number) => {
    setSlideIndex(idx);
    setCaptionKey((k) => k + 1);
    startAuto();
  };

  const slide = FEATURE_SLIDES[slideIndex];

  return (
    /*
     * Full-screen column. pt-[72px] clears the fixed navbar.
     * The section is split: ~52% hero copy, ~48% showcase (flex-1 on showcase).
     */
    <section className="flex flex-col items-center text-center w-full h-screen pt-[72px] pb-3 px-4 overflow-hidden">

      {/* ── Top hero block ─────────────────────────────────────── */}
      <div className="flex flex-col items-center shrink-0 w-full max-w-3xl py-4 gap-3">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-muted"
        >
          <Navigation className="h-3.5 w-3.5 text-teal shrink-0"/>
          Your AI travel agent, ready when you are
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
          className="font-display text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl"
        >
          Just say where you want to{" "}
          <span className="text-gradient">go.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }}
          className="text-base text-muted max-w-xl"
        >
          Your AI travel agent finds the best ride, locks in a protected payment, and gets you there — all from one sentence.
        </motion.p>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-gradient-border w-full max-w-lg flex items-center gap-3 rounded-full p-2 pl-5"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-teal"/>
          <div className="relative flex-1 overflow-hidden text-left h-6">
            <AnimatePresence mode="wait">
              <motion.span
                key={destIndex}
                initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="absolute inset-0 truncate text-sm text-foreground/70 leading-6"
              >
                {DESTINATIONS[destIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
          <Link href="/signup">
            <button aria-label="Get started" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-brand text-white shadow-lg shadow-indigo/30 transition hover:brightness-110">
              <ArrowRight className="h-4 w-4"/>
            </button>
          </Link>
        </motion.div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.26 }}
          className="flex items-center gap-3"
        >
          <Link href="/signup">
            <Button variant="gradient" size="lg" className="h-10 px-7 text-sm rounded-full">
              Get started free
            </Button>
          </Link>
          <button
            onClick={() => goTo((slideIndex + 1) % FEATURE_SLIDES.length)}
            className="h-10 px-7 text-sm font-medium glass rounded-full text-foreground/80 hover:bg-white/10 transition"
          >
            See how it works
          </button>
        </motion.div>
      </div>

      {/* ── Feature Showcase — takes ALL remaining vertical space ── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.36 }}
        className="relative w-full max-w-5xl flex-1 min-h-0 mt-1"
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-16 blur-3xl opacity-25 rounded-full transition-all duration-700"
          style={{ background: slide.accent }}
        />

        <div className="h-full rounded-3xl glass border border-white/10 overflow-hidden shadow-2xl flex flex-col sm:flex-row">

          {/* App screen preview — 70% wide */}
          <div className="flex-1 min-h-0 p-3 sm:p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.38 }}
                className="h-full"
              >
                {slide.preview}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right info panel — fixed 220px */}
          <div className="sm:w-[220px] border-t sm:border-t-0 sm:border-l border-white/10 bg-white/[0.03] p-5 flex flex-col justify-between shrink-0">

            {/* Label + caption */}
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                <motion.div key={slide.id + "-info"}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}>

                  {/* Pill label */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-3"
                    style={{ background: `${slide.accent}1a`, color: slide.accent, border: `1px solid ${slide.accent}40` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: slide.accent }}/>
                    {slide.label}
                  </div>

                  {/* Typewriter caption */}
                  <p className="text-[13px] leading-relaxed min-h-[5rem]">
                    <SlideCaption key={captionKey} text={slide.caption} accent={slide.accent}/>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slide navigation */}
            <div className="space-y-3 mt-4">
              {/* Feature names list */}
              <div className="space-y-1.5">
                {FEATURE_SLIDES.map((f, i) => (
                  <button key={f.id} onClick={() => goTo(i)}
                    className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg transition-all ${
                      i === slideIndex
                        ? "bg-white/10 text-foreground font-semibold"
                        : "text-muted/60 hover:text-muted hover:bg-white/5"
                    }`}
                  >
                    {i === slideIndex && <span className="inline-block w-1 h-1 rounded-full mr-1.5 align-middle" style={{ background: slide.accent }}/>}
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Dot + arrows */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {FEATURE_SLIDES.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)}
                      className="transition-all duration-300 rounded-full"
                      style={{
                        width: i === slideIndex ? 18 : 5,
                        height: 5,
                        background: i === slideIndex ? slide.accent : "rgba(255,255,255,0.18)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => goTo((slideIndex - 1 + FEATURE_SLIDES.length) % FEATURE_SLIDES.length)}
                    className="w-7 h-7 rounded-full glass flex items-center justify-center text-muted hover:text-foreground hover:bg-white/10 transition">
                    <ChevronLeft className="w-3.5 h-3.5"/>
                  </button>
                  <button onClick={() => goTo((slideIndex + 1) % FEATURE_SLIDES.length)}
                    className="w-7 h-7 rounded-full glass flex items-center justify-center text-muted hover:text-foreground hover:bg-white/10 transition">
                    <ChevronRight className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
