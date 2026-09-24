"use client";

import { useActionState, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Navigation,
  AlertCircle,
  Mic,
  MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { RideOfferCard } from "./ride-offer-card";
import { BookingPanel } from "./booking-panel";
import { MockMap } from "./mock-map";
import { requestRide, type RideResult } from "@/app/(app)/ride/actions";

const INITIAL: RideResult = { error: null };

export function RideExperience({ examples }: { examples: string[] }) {
  const [state, formAction, pending] = useActionState(requestRide, INITIAL);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const hasResults = !!state.offers && state.offers.length > 0;

  // When new offers arrive, default selection to the AI's top recommended pick
  useEffect(() => {
    if (state.offers && state.offers.length > 0) {
      const topPick = state.offers.find((o) => o.selected) ?? state.offers[0];
      if (topPick) {
        setSelectedOfferId(topPick.offerId);
      }
    }
  }, [state.offers]);

  // Voice command support via Web Speech API / Hugging Face Whisper
  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser. Please type your destination.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setQueryInput(transcript);
      }
    };

    recognition.start();
  };

  const selectedOffer = state.offers?.find((o) => o.offerId === selectedOfferId) ?? state.offers?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Where to, <span className="text-gradient">today?</span>
        </h1>
        <p className="mt-1 text-muted">
          Tell your agent in plain words — it compares every provider and lets you choose.
        </p>
      </div>

      {/* AI search bar with Voice command */}
      <form action={formAction}>
        <div className="glass-gradient-border flex items-center gap-3 rounded-full p-2 pl-5">
          <Sparkles className="h-5 w-5 shrink-0 text-teal" />
          <input
            name="query"
            value={queryInput || state.query || ""}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Take me to the airport…"
            autoComplete="off"
            className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted/60"
          />
          {/* Voice Command Button */}
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-2 rounded-full transition ${
              isListening ? "bg-[#ff6e84] text-white animate-pulse" : "text-muted hover:text-foreground"
            }`}
            title="Speak your destination"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <Button
            type="submit"
            size="icon"
            variant="gradient"
            disabled={pending}
            aria-label="Find rides"
          >
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>

      {/* Example chips */}
      {!hasResults && !pending ? (
        <div className="flex flex-wrap gap-2">
          {examples.map((ex, idx) => (
            <button
              type="button"
              onClick={() => {
                setQueryInput(ex);
              }}
              key={`example-${idx}-${ex}`}
              className="glass rounded-full px-4 py-2 text-sm text-muted transition hover:text-foreground hover:border-teal/30"
            >
              {ex}
            </button>
          ))}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {pending ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="flex items-center gap-3 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-teal" />
              <span className="text-muted">
                Your agent is comparing rides across every provider…
              </span>
            </GlassCard>
          </motion.div>
        ) : state.error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-start gap-2 rounded-xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-3 py-2.5 text-sm text-[#ff9bab]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          </motion.div>
        ) : state.needsClarification ? (
          <motion.div key="clarify" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard className="flex items-start gap-3">
              <Navigation className="mt-0.5 h-5 w-5 text-teal" />
              <p className="text-muted">{state.clarificationPrompt}</p>
            </GlassCard>
          </motion.div>
        ) : hasResults ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Agent reasoning card */}
            <GlassCard gradientBorder className="aurora-mesh">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                  <Sparkles className="h-4 w-4 text-teal" />
                  AI Recommendation: {state.selectedProvider}
                </div>
                <span className="text-xs text-muted">Click any ride below to customize your choice</span>
              </div>
              <p className="mt-2 text-lg text-foreground">{state.reasoning}</p>
              {state.savings ? (
                <p className="mt-1 text-sm text-teal font-medium">{state.savings}</p>
              ) : null}
            </GlassCard>

            {/* Map Preview */}
            <MockMap
              originAddress={state.originAddress}
              originLat={state.originLat}
              originLng={state.originLng}
              destinationAddress={state.destinationAddress}
              destinationLat={state.destinationLat}
              destinationLng={state.destinationLng}
              status="SEARCH_PREVIEW"
              provider={selectedOffer ? selectedOffer.provider : "Easy Ride Agent"}
              showPreviewOnly
            />

            {/* Interactive Ranked offers - Customers can click any card to select! */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Available Rides ({state.offers!.length})
                </span>
                <span className="text-xs text-muted">
                  Selected: <strong className="text-teal font-medium">{selectedOffer?.provider}</strong>
                </span>
              </div>
              {state.offers!.map((o, idx) => (
                <RideOfferCard
                  key={o.offerId || `offer-${o.provider}-${idx}`}
                  offer={o}
                  isSelected={o.offerId === selectedOfferId}
                  onSelect={() => setSelectedOfferId(o.offerId)}
                />
              ))}
            </div>

            {/* Book + payment timeline */}
            {state.rideRequestId ? (
              <BookingPanel
                rideRequestId={state.rideRequestId}
                selectedOffer={selectedOffer}
              />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
