"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, MapPin, Clock, Star } from "lucide-react";

// ─── Animated placeholder destinations ──────────────────────────────────────
const SUGGESTIONS = [
  { text: "Take me to the airport ✈️",         icon: "✈️", tag: "Popular" },
  { text: "Cheapest ride downtown 🏙️",          icon: "🏙️", tag: "Budget" },
  { text: "Get me home after the concert 🎶",  icon: "🎶", tag: "Night" },
  { text: "Fastest EV ride to the office 💼",  icon: "💼", tag: "Eco" },
  { text: "Book a ride to the hospital 🏥",    icon: "🏥", tag: "Urgent" },
  { text: "Drop me at the train station 🚆",   icon: "🚆", tag: "Transit" },
  { text: "Late night ride home 🌙",            icon: "🌙", tag: "Late" },
  { text: "Ride to the shopping mall 🛍️",      icon: "🛍️", tag: "Shopping" },
];

// Typewriter hook
function useTypewriter(text: string, speed = 38) {
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

// ─── Animated placeholder component ─────────────────────────────────────────
function AnimatedPlaceholder({ suggestionIndex }: { suggestionIndex: number }) {
  const { displayed, done } = useTypewriter(SUGGESTIONS[suggestionIndex].text, 36);
  return (
    <span className="text-sm text-muted/60 pointer-events-none select-none">
      {displayed}
      {!done && (
        <span className="inline-block w-0.5 h-4 ml-0.5 align-middle bg-teal animate-pulse rounded-full" />
      )}
    </span>
  );
}

export function DashboardSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggIdx, setSuggIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cycle placeholder
  useEffect(() => {
    if (focused || query) return;
    const id = setInterval(() => setSuggIdx(i => (i + 1) % SUGGESTIONS.length), 3200);
    return () => clearInterval(id);
  }, [focused, query]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submit = (text?: string) => {
    const q = (text ?? query).trim();
    if (!q) return;
    router.push(`/ride?q=${encodeURIComponent(q)}`);
  };

  const showDropdown = focused && !query;

  return (
    <div ref={containerRef} className="relative w-full">

      {/* ── Search bar ─────────────────────────────────────────── */}
      <motion.div
        animate={{
          boxShadow: focused
            ? "0 0 0 2px rgba(20,184,166,0.4), 0 20px 60px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(0,0,0,0.3)",
        }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 w-full rounded-2xl bg-white/[0.07] border border-white/10 px-5 py-4 cursor-text"
        onClick={() => { inputRef.current?.focus(); }}
      >
        {/* Icon */}
        <motion.div animate={{ scale: focused ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
          <Sparkles className="w-5 h-5 text-teal shrink-0" />
        </motion.div>

        {/* Input + animated placeholder */}
        <div className="flex-1 relative h-6 flex items-center">
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={e => e.key === "Enter" && submit()}
            className="absolute inset-0 bg-transparent text-sm text-foreground outline-none z-10 placeholder:text-transparent w-full"
            placeholder=" "
            aria-label="Where do you want to go?"
          />
          {/* Animated placeholder — only when input is empty */}
          {!query && (
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={focused ? "focused" : suggIdx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  {focused ? (
                    <span className="text-sm text-muted/40">Where do you want to go?</span>
                  ) : (
                    <AnimatedPlaceholder suggestionIndex={suggIdx} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Submit button */}
        <motion.button
          onClick={() => submit()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!query.trim()}
          className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-lg shadow-indigo/30 hover:brightness-110 transition shrink-0 disabled:opacity-30"
          aria-label="Search"
        >
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* ── Suggestions dropdown ───────────────────────────────── */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-white/10 bg-[#111827]/98 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center gap-2">
              <Star className="w-3 h-3 text-teal" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Popular destinations</span>
            </div>

            {/* Suggestions list */}
            <div className="py-1.5">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s.text}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => { setQuery(s.text); submit(s.text); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.06] transition-colors text-left group"
                >
                  <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-base shrink-0 group-hover:bg-teal/10 group-hover:border-teal/20 transition">
                    {s.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate group-hover:text-teal transition">
                      {s.text.replace(/\s\S+$/, "")} {/* strip trailing emoji from label */}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.08] text-muted font-semibold shrink-0">
                    {s.tag}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted/30 group-hover:text-teal transition shrink-0" />
                </motion.button>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t border-white/[0.07] flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted/40" />
              <span className="text-[10px] text-muted/50">Or type any destination and press Enter</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
