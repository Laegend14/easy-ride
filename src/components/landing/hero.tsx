"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

const DESTINATIONS = [
  "Take me to the airport",
  "Downtown by 9am, cheapest option",
  "Get me home after the concert",
  "An EV ride to the office",
];

export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % DESTINATIONS.length),
      2800,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative flex flex-col items-center px-4 pb-24 pt-40 text-center sm:pt-48">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-muted"
      >
        <Navigation className="h-3.5 w-3.5 text-teal" />
        Your AI travel agent, ready when you are
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.05 }}
        className="max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl"
      >
        Just say where you want to{" "}
        <span className="text-gradient">go.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="mt-6 max-w-2xl text-lg text-muted sm:text-xl"
      >
        Your AI travel agent finds the best ride, locks in a protected payment,
        and gets you there — all from one sentence.
      </motion.p>

      {/* AI search bar (visual) */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="glass-gradient-border mt-10 flex w-full max-w-xl items-center gap-3 rounded-full p-2 pl-5"
      >
        <Sparkles className="h-5 w-5 shrink-0 text-teal" />
        <div className="relative flex-1 overflow-hidden text-left">
          <motion.span
            key={index}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="block truncate text-base text-foreground/80"
          >
            {DESTINATIONS[index]}
          </motion.span>
        </div>
        <button
          aria-label="Ask Easy Ride"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-brand text-white shadow-lg shadow-indigo/30 transition hover:brightness-110"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
      >
        <Link href="/signup">
          <Button variant="gradient" size="lg">
            Get started free
          </Button>
        </Link>
        <a href="#how-it-works">
          <Button variant="glass" size="lg">
            See how it works
          </Button>
        </a>
      </motion.div>
    </section>
  );
}
