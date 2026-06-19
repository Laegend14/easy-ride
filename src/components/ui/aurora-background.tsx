"use client";

import { motion } from "framer-motion";

/**
 * Animated aurora gradient mesh. Three soft blobs that slowly drift, layered
 * behind page content. Fixed, non-interactive, respects reduced motion.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <motion.div
        className="absolute -left-[10%] top-[-15%] h-[55vw] w-[55vw] rounded-full opacity-50 blur-[120px]"
        style={{ background: "radial-gradient(circle, #14b8a6 0%, transparent 70%)" }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-10%] top-[5%] h-[50vw] w-[50vw] rounded-full opacity-45 blur-[120px]"
        style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }}
        animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[20%] h-[60vw] w-[60vw] rounded-full opacity-45 blur-[130px]"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        animate={{ x: [0, 40, 0], y: [0, -40, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Subtle grain/vignette so blobs read as depth, not flat color. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(11,11,20,0.7)_100%)]" />
    </div>
  );
}
