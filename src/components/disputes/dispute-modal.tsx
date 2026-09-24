"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert, Loader2, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { DisputeCategory, DisputeRecord } from "@/lib/disputes/dispute-service";

interface DisputeModalProps {
  bookingId: string;
  provider: string;
  fareCents: number;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: DisputeCategory; label: string; desc: string }[] = [
  { id: "driver_no_show", label: "Driver Never Showed Up", desc: "I waited at pickup, driver marked arrived or cancelled." },
  { id: "late_arrival", label: "Severely Late (15+ min)", desc: "Driver was excessively delayed beyond estimated ETA." },
  { id: "unsafe_driving", label: "Unsafe Driving / Safety Concern", desc: "Speeding, reckless behavior, or vehicle safety hazard." },
  { id: "route_deviation", label: "Inefficient Route / Overcharge", desc: "Driver took unnecessary detours resulting in higher fare." },
  { id: "vehicle_condition", label: "Cleanliness or Vehicle Mismatch", desc: "Vehicle was unacceptable or didn't match description." },
];

export function DisputeModal({ bookingId, provider, fareCents, isOpen, onClose }: DisputeModalProps) {
  const [category, setCategory] = useState<DisputeCategory>("driver_no_show");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DisputeRecord | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          category,
          description,
          fareCents,
        }),
      });

      const data = await res.json();
      if (data.dispute) {
        setResult(data.dispute);
      }
    } catch (err) {
      console.error("Dispute submit failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl bg-surface border border-white/10 shadow-2xl p-6 text-foreground relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted hover:text-foreground transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!result ? (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#ff6e84]/15 text-[#ff9bab] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Report an Issue with this Ride</h3>
                <p className="text-xs text-muted">Protected Payment Dispute Resolution • {provider}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
                  Select Issue Type
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {CATEGORIES.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`p-3 rounded-xl border text-sm cursor-pointer transition ${
                        category === c.id
                          ? "bg-teal/10 border-teal text-foreground"
                          : "bg-white/5 border-white/10 text-muted hover:border-white/20"
                      }`}
                    >
                      <p className="font-medium text-foreground">{c.label}</p>
                      <p className="text-xs text-muted mt-0.5">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
                  Explain What Happened
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail. Our AI will analyze route telemetry and timestamps..."
                  rows={3}
                  className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-foreground outline-none focus:border-teal placeholder:text-muted/60"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="glass" size="md" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="md" disabled={loading || !description.trim()}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing with AI…
                    </span>
                  ) : (
                    "Submit Dispute"
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            {result.status === "ai_refunded" ? (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-teal/15 text-teal flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Instant Refund Approved</h3>
                <p className="text-sm text-muted max-w-md mx-auto">{result.aiExplanation}</p>
                <div className="p-4 rounded-2xl bg-teal/10 border border-teal/30 inline-block text-left">
                  <p className="text-xs text-muted uppercase tracking-wider">Refund Amount</p>
                  <p className="text-2xl font-bold text-teal">${(result.refundAmountCents / 100).toFixed(2)} USD</p>
                  <p className="text-[11px] text-muted mt-1">Credited back to your Easy Ride Balance / Payment Method</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 mx-auto rounded-full bg-violet/15 text-violet flex items-center justify-center">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Transferred to Human Support</h3>
                <p className="text-sm text-muted max-w-md mx-auto">{result.aiExplanation}</p>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 inline-block text-center">
                  <p className="text-xs text-muted uppercase tracking-wider">Support Ticket Reference</p>
                  <p className="text-xl font-bold text-violet">{result.ticketId}</p>
                  <p className="text-[11px] text-muted mt-1">Priority Queue • Support agent reviewing telemetry</p>
                </div>
              </>
            )}

            <div>
              <Button variant="gradient" size="md" onClick={onClose} className="w-full">
                Done
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
