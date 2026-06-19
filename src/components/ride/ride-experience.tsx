"use client";

import { useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Navigation,
  AlertCircle,
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
  const hasResults = !!state.offers && state.offers.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Where to, <span className="text-gradient">today?</span>
        </h1>
        <p className="mt-1 text-muted">
          Tell your agent in plain words — it compares every provider for you.
        </p>
      </div>

      {/* AI search bar */}
      <form action={formAction}>
        <div className="glass-gradient-border flex items-center gap-3 rounded-full p-2 pl-5">
          <Sparkles className="h-5 w-5 shrink-0 text-teal" />
          <input
            name="query"
            defaultValue={state.query ?? ""}
            placeholder="Take me to the airport…"
            autoComplete="off"
            className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted/60"
          />
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
          {examples.map((ex) => (
            <form action={formAction} key={ex}>
              <input type="hidden" name="query" value={ex} />
              <button
                type="submit"
                className="glass rounded-full px-4 py-2 text-sm text-muted transition hover:text-foreground"
              >
                {ex}
              </button>
            </form>
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
            {/* Agent reasoning */}
            <GlassCard gradientBorder className="aurora-mesh">
              <div className="flex items-center gap-2 text-sm font-medium text-muted">
                <Sparkles className="h-4 w-4 text-teal" />
                Your agent recommends {state.selectedProvider}
              </div>
              <p className="mt-2 text-lg text-foreground">{state.reasoning}</p>
              {state.savings ? (
                <p className="mt-1 text-sm text-teal">{state.savings}</p>
              ) : null}
            </GlassCard>

            {/* Route Preview Map */}
            <MockMap
              originAddress={state.originAddress}
              originLat={state.originLat}
              originLng={state.originLng}
              destinationAddress={state.destinationAddress}
              destinationLat={state.destinationLat}
              destinationLng={state.destinationLng}
              status="SEARCH_PREVIEW"
              provider={state.selectedProvider ?? "Easy Ride Agent"}
              showPreviewOnly
            />

            {/* Ranked offers */}
            <div className="space-y-3">
              {state.offers!.map((o) => (
                <RideOfferCard key={o.offerId} offer={o} />
              ))}
            </div>

            {/* Book + payment timeline */}
            {state.rideRequestId ? (
              <BookingPanel rideRequestId={state.rideRequestId} />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
