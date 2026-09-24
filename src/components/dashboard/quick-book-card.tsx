"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowRight, RotateCcw, Car, Sparkles } from "lucide-react";

const QUICK_CHIPS = [
  { label: "Airport", icon: "✈️" },
  { label: "Home",    icon: "🏠" },
  { label: "Office",  icon: "💼" },
  { label: "Hospital",icon: "🏥" },
];

const AI_EXAMPLES = [
  "Take me to the airport by 8am",
  "Cheapest EV ride downtown",
  "Get me home after the concert",
  "Book the fastest ride nearby",
];

export function QuickBookCard() {
  const router = useRouter();
  const [mode, setMode] = useState<"direct" | "ai">("direct");
  const [from, setFrom] = useState("");
  const [to,   setTo]   = useState("");
  const [query, setQuery] = useState("");

  const swap = () => { setFrom(to); setTo(from); };

  const bookDirect = () => {
    if (!from.trim() || !to.trim()) return;
    router.push(`/ride?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  };

  const bookAi = () => {
    if (!query.trim()) return;
    router.push(`/ride?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-sm overflow-hidden shadow-lg">

      {/* Mode tabs */}
      <div className="flex p-1.5 gap-1 bg-white/[0.03] border-b border-white/[0.07]">
        <button
          onClick={() => setMode("direct")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === "direct"
              ? "bg-gradient-brand text-white shadow-md"
              : "text-muted hover:text-foreground hover:bg-white/5"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> Pick locations
        </button>
        <button
          onClick={() => setMode("ai")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === "ai"
              ? "bg-gradient-brand text-white shadow-md"
              : "text-muted hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Ask AI
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Direct mode ─────────────────────────────────────── */}
        {mode === "direct" && (
          <motion.div key="direct"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="p-4 space-y-2.5"
          >
            {/* From */}
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 focus-within:border-teal/40 focus-within:bg-white/[0.09] transition-all">
              <div className="w-2.5 h-2.5 rounded-full bg-teal border-2 border-white shadow shrink-0" />
              <input
                value={from}
                onChange={e => setFrom(e.target.value)}
                onKeyDown={e => e.key === "Enter" && bookDirect()}
                placeholder="Pickup location"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/55 outline-none"
              />
              {from && (
                <button onClick={() => setFrom("")} className="text-muted/40 hover:text-muted text-xs shrink-0">✕</button>
              )}
            </div>

            {/* Divider + swap */}
            <div className="relative flex items-center">
              <div className="absolute inset-x-0 border-t border-dashed border-white/[0.08]" />
              <button
                onClick={swap}
                title="Swap"
                className="relative ml-auto mr-4 w-7 h-7 rounded-full bg-surface border border-white/15 flex items-center justify-center text-muted hover:text-foreground hover:bg-white/10 transition shadow-md"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* To */}
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 focus-within:border-violet/40 focus-within:bg-white/[0.09] transition-all">
              <MapPin className="w-3.5 h-3.5 text-violet shrink-0" />
              <input
                value={to}
                onChange={e => setTo(e.target.value)}
                onKeyDown={e => e.key === "Enter" && bookDirect()}
                placeholder="Where to?"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/55 outline-none"
              />
              {to && (
                <button onClick={() => setTo("")} className="text-muted/40 hover:text-muted text-xs shrink-0">✕</button>
              )}
            </div>

            {/* Quick chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
              {QUICK_CHIPS.map(c => (
                <button
                  key={c.label}
                  onClick={() => setTo(c.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    to === c.label
                      ? "bg-violet/15 border-violet/40 text-violet"
                      : "bg-white/[0.04] border-white/10 text-muted hover:border-white/20 hover:text-foreground"
                  }`}
                >
                  <span>{c.icon}</span> {c.label}
                </button>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={bookDirect}
              disabled={!from.trim() || !to.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-gradient-brand text-white shadow-lg shadow-indigo/20 hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Car className="w-4 h-4" />
              {from.trim() && to.trim() ? "Find best rides" : "Enter pickup & destination"}
              {from.trim() && to.trim() && <ArrowRight className="w-4 h-4" />}
            </button>
          </motion.div>
        )}

        {/* ── AI mode ─────────────────────────────────────────── */}
        {mode === "ai" && (
          <motion.div key="ai"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="p-4 space-y-3"
          >
            {/* Prominent AI input */}
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border-2 border-teal/30 px-4 py-3.5 focus-within:border-teal/60 focus-within:bg-white/[0.09] transition-all">
              <Sparkles className="w-4 h-4 text-teal shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && bookAi()}
                placeholder="Describe your ride in plain English…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/55 outline-none"
                autoFocus={false}
              />
            </div>

            {/* Example chips */}
            <div className="grid grid-cols-2 gap-2">
              {AI_EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => { setQuery(ex); router.push(`/ride?q=${encodeURIComponent(ex)}`); }}
                  className="text-left text-[11px] px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-muted hover:bg-white/[0.08] hover:text-foreground hover:border-teal/20 transition leading-snug"
                >
                  {ex}
                </button>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={bookAi}
              disabled={!query.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-gradient-brand text-white shadow-lg shadow-indigo/20 hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              Ask AI to book
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-[10px] text-muted/50">AI compares all providers and books the best match</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
