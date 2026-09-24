"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Car,
  Zap,
  Clock,
} from "lucide-react";

// ─── Quick destination chips ──────────────────────────────────────────────────
const QUICK_DESTINATIONS = [
  { label: "Airport", icon: "✈️" },
  { label: "Home", icon: "🏠" },
  { label: "Office", icon: "💼" },
  { label: "Hospital", icon: "🏥" },
];

// ─── Mapbox static tile background ────────────────────────────────────────────
function MapBackground({ from, to }: { from: string; to: string }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const hasBoth = from.trim().length > 2 && to.trim().length > 2;

  // Decorative SVG map illustration when no token / no route yet
  return (
    <div className="relative w-full h-full bg-[#0a1020] overflow-hidden">
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]">
        <defs>
          <pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#14b8a6" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
      </svg>

      {/* Road lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#1e293b" strokeWidth="12"/>
        <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#1e293b" strokeWidth="8"/>
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#1e293b" strokeWidth="10"/>
        <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#1e293b" strokeWidth="8"/>
      </svg>

      {/* Route line when both set */}
      {hasBoth && (
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="route-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14b8a6"/>
              <stop offset="100%" stopColor="#6366f1"/>
            </linearGradient>
          </defs>
          <path
            d="M 80 200 Q 160 170 240 130 Q 300 100 380 75"
            stroke="url(#route-grad)" strokeWidth="3" fill="none"
            strokeLinecap="round" strokeDasharray="8 4"
            className="animate-route-pulse"
          />
          {/* Glow */}
          <path
            d="M 80 200 Q 160 170 240 130 Q 300 100 380 75"
            stroke="#14b8a6" strokeWidth="8" fill="none"
            strokeLinecap="round" opacity="0.15"
          />
        </svg>
      )}

      {/* Origin pin */}
      {hasBoth && (
        <div className="absolute bottom-[42%] left-[14%] flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-teal border-2 border-white shadow-lg shadow-teal/50"/>
          <div className="px-2 py-0.5 rounded-full bg-teal/20 border border-teal/40 text-[9px] text-teal font-bold truncate max-w-[80px]">
            {from.slice(0, 12)}
          </div>
        </div>
      )}

      {/* Destination pin */}
      {hasBoth && (
        <div className="absolute top-[18%] right-[12%] flex flex-col items-center gap-0.5">
          <MapPin className="w-7 h-7 text-violet" fill="#a855f7" strokeWidth={1.5}/>
          <div className="px-2 py-0.5 rounded-full bg-violet/20 border border-violet/40 text-[9px] text-violet font-bold truncate max-w-[80px]">
            {to.slice(0, 12)}
          </div>
        </div>
      )}

      {/* Animated car */}
      {hasBoth && (
        <motion.div
          animate={{ x: [0, 40, 90, 145, 195, 250], y: [0, -20, -40, -60, -78, -98] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[43%] left-[14%]"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal to-indigo flex items-center justify-center shadow-xl shadow-teal/40">
            <Car className="w-4.5 h-4.5 text-white"/>
          </div>
        </motion.div>
      )}

      {/* Idle state — city buildings silhouette */}
      {!hasBoth && (
        <>
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-4 opacity-10">
            {[60,90,50,120,70,100,55,80,110,45,95].map((h, i) => (
              <div key={i} className="bg-slate-400 rounded-t-sm" style={{ width: 18, height: h }}/>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-40">
            <Navigation className="w-10 h-10 text-teal"/>
            <p className="text-xs text-teal font-semibold">Enter pickup & destination</p>
          </div>
        </>
      )}

      {/* Gradient overlay bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a1020] to-transparent"/>
    </div>
  );
}

// ─── Main Dashboard Map Widget ────────────────────────────────────────────────
export function DashboardMapWidget() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState<"map" | "ai">("map");

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleBook = () => {
    if (!from.trim() || !to.trim()) return;
    const params = new URLSearchParams({ from, to });
    router.push(`/ride?${params.toString()}`);
  };

  const handleAiSearch = (text: string) => {
    const params = new URLSearchParams({ q: text });
    router.push(`/ride?${params.toString()}`);
  };

  const canBook = from.trim().length > 1 && to.trim().length > 1;

  return (
    <div className="rounded-3xl border border-white/10 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-2xl">

      {/* ── Mode toggle ────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-3 border-b border-white/[0.08] bg-white/[0.02]">
        <button
          onClick={() => setMode("map")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
            mode === "map"
              ? "bg-gradient-brand text-white shadow-md"
              : "text-muted hover:text-foreground hover:bg-white/5"
          }`}
        >
          <MapPin className="w-4 h-4"/> Pick on map
        </button>
        <button
          onClick={() => setMode("ai")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
            mode === "ai"
              ? "bg-gradient-brand text-white shadow-md"
              : "text-muted hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-4 h-4"/> Ask AI
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "map" ? (
          <motion.div key="map"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>

            {/* Map canvas */}
            <div className="relative h-52">
              <MapBackground from={from} to={to}/>

              {/* ETA overlay — shows when route is set */}
              {canBook && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 left-4 right-4 flex items-center gap-3 bg-background/90 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/10 shadow-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal"/>
                    <span className="text-xs font-semibold text-teal">~6 min</span>
                  </div>
                  <div className="h-4 w-px bg-white/10"/>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-violet"/>
                    <span className="text-xs font-semibold text-foreground">AI comparing fares…</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse"/>
                    <span className="text-[10px] text-muted">Live</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* From / To inputs */}
            <div className="p-4 space-y-2">
              <div className="relative">
                {/* From input */}
                <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 focus-within:border-teal/50 focus-within:bg-white/[0.09] transition-all">
                  <div className="w-3 h-3 rounded-full bg-teal border-2 border-white shadow shrink-0"/>
                  <input
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    placeholder="Pickup location"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/60 outline-none"
                  />
                  {from && (
                    <button onClick={() => setFrom("")} className="text-muted/40 hover:text-muted text-xs shrink-0">✕</button>
                  )}
                </div>

                {/* Swap button */}
                <button
                  onClick={handleSwap}
                  className="absolute -bottom-3 right-4 z-10 w-7 h-7 rounded-full bg-surface border border-white/15 flex items-center justify-center text-muted hover:text-foreground hover:bg-white/10 transition shadow-lg"
                  title="Swap from / to"
                >
                  <RotateCcw className="w-3.5 h-3.5"/>
                </button>
              </div>

              {/* To input */}
              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 focus-within:border-violet/50 focus-within:bg-white/[0.09] transition-all">
                <MapPin className="w-3.5 h-3.5 text-violet shrink-0"/>
                <input
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  placeholder="Where to?"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/60 outline-none"
                />
                {to && (
                  <button onClick={() => setTo("")} className="text-muted/40 hover:text-muted text-xs shrink-0">✕</button>
                )}
              </div>

              {/* Quick chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                {QUICK_DESTINATIONS.map((d) => (
                  <button
                    key={d.label}
                    onClick={() => setTo(d.label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all ${
                      to === d.label
                        ? "bg-violet/15 border-violet/40 text-violet"
                        : "bg-white/[0.04] border-white/10 text-muted hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    <span>{d.icon}</span> {d.label}
                  </button>
                ))}
              </div>

              {/* Book button */}
              <button
                onClick={handleBook}
                disabled={!canBook}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-gradient-brand text-white shadow-lg shadow-indigo/25 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Car className="w-4 h-4"/>
                {canBook ? `Find rides · ${from} → ${to}` : "Enter pickup & destination"}
                {canBook && <ArrowRight className="w-4 h-4"/>}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── AI mode ──────────────────────────────────────── */
          <motion.div key="ai"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <AiInputPanel onSearch={handleAiSearch}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI Input Panel ────────────────────────────────────────────────────────────
const AI_EXAMPLES = [
  "Take me to the airport by 8am",
  "Cheapest EV ride downtown",
  "Get me home from the concert",
  "Book the fastest ride nearby",
];

function AiInputPanel({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");
  const [exIdx, setExIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => setExIdx(i => (i + 1) % AI_EXAMPLES.length), 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => {
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <div className="p-4 space-y-4">
      {/* Prominent AI input */}
      <div className="relative">
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] border-2 border-teal/30 px-4 py-4 focus-within:border-teal/60 focus-within:bg-white/[0.10] transition-all shadow-lg shadow-teal/5">
          <Sparkles className="w-5 h-5 text-teal shrink-0"/>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder=""
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted/60 relative z-10"
            />
            {/* Animated placeholder when empty */}
            {!query && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={exIdx}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}
                  className="absolute inset-0 pointer-events-none text-sm text-muted/50 flex items-center"
                >
                  {AI_EXAMPLES[exIdx]}
                </motion.span>
              </AnimatePresence>
            )}
          </div>
          <button
            onClick={submit}
            disabled={!query.trim()}
            className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-lg shadow-indigo/30 hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <ArrowRight className="w-4 h-4"/>
          </button>
        </div>
        {/* Glow ring */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-teal/10 blur-sm -z-10"/>
      </div>

      {/* Label */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/[0.06]"/>
        <span className="text-[11px] text-muted font-medium uppercase tracking-wider">Try asking</span>
        <div className="h-px flex-1 bg-white/[0.06]"/>
      </div>

      {/* Example chips */}
      <div className="grid grid-cols-2 gap-2">
        {AI_EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => { setQuery(ex); onSearch(ex); }}
            className="text-left text-xs px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-muted hover:bg-white/[0.08] hover:text-foreground hover:border-teal/20 transition-all leading-snug"
          >
            {ex}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-center text-muted/50">
        <Sparkles className="w-3 h-3 inline mr-1 text-teal opacity-60"/>
        AI compares all providers and books the best match
      </p>
    </div>
  );
}
