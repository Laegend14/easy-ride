"use client";

import { useActionState, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Briefcase,
  Star,
  Zap,
  Scale,
  Coins,
  Crown,
  Users,
  ArrowLeft,
  ArrowRight,
  Check,
  Navigation,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { OptionCard } from "@/components/ui/option-card";
import {
  completeOnboarding,
  type OnboardingState,
} from "@/app/onboarding/actions";
import type { OptimizationGoal } from "@/types/database";

export type OnboardingInitial = {
  fullName: string;
  optimizationGoal: OptimizationGoal;
  dailyBudgetCents: number;
  maxRideCents: number;
  evPreferred: boolean;
  premiumPreferred: boolean;
  sharedRideAllowed: boolean;
};

const GOAL_OPTIONS: {
  value: OptimizationGoal;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  { value: "cheapest", title: "Cheapest", description: "Always pick the lowest fare", icon: <Coins className="h-5 w-5" /> },
  { value: "fastest", title: "Fastest", description: "Get there in the least time", icon: <Zap className="h-5 w-5" /> },
  { value: "balanced", title: "Balanced", description: "Best mix of price and speed", icon: <Scale className="h-5 w-5" /> },
  { value: "highest_rated", title: "Top rated", description: "Favor the best-rated rides", icon: <Star className="h-5 w-5" /> },
];

const INITIAL_STATE: OnboardingState = { error: null };
const dollars = (cents: number) => (cents / 100).toFixed(2);

export function OnboardingWizard({ initial }: { initial: OnboardingInitial }) {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(initial.fullName);
  const [homeAddress, setHomeAddress] = useState("");
  const [workAddress, setWorkAddress] = useState("");
  const [goal, setGoal] = useState<OptimizationGoal>(initial.optimizationGoal);
  const [dailyBudget, setDailyBudget] = useState(dollars(initial.dailyBudgetCents));
  const [maxRide, setMaxRide] = useState(dollars(initial.maxRideCents));
  const [ev, setEv] = useState(initial.evPreferred);
  const [premium, setPremium] = useState(initial.premiumPreferred);
  const [shared, setShared] = useState(initial.sharedRideAllowed);

  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    INITIAL_STATE,
  );

  const payload = useMemo(
    () =>
      JSON.stringify({
        fullName: fullName.trim(),
        homeAddress: homeAddress.trim(),
        workAddress: workAddress.trim(),
        optimizationGoal: goal,
        dailyBudgetCents: Math.round(parseFloat(dailyBudget || "0") * 100),
        maxRideCents: Math.round(parseFloat(maxRide || "0") * 100),
        evPreferred: ev,
        premiumPreferred: premium,
        sharedRideAllowed: shared,
      }),
    [fullName, homeAddress, workAddress, goal, dailyBudget, maxRide, ev, premium, shared],
  );

  const steps = ["You", "Places", "Your agent", "Review"];
  const canNext =
    (step === 0 && fullName.trim().length > 0) ||
    (step === 1 && homeAddress.trim().length > 0) ||
    (step === 2 &&
      parseFloat(dailyBudget || "0") > 0 &&
      parseFloat(maxRide || "0") > 0) ||
    step === 3;

  return (
    <form action={formAction}>
      <input type="hidden" name="payload" value={payload} />

      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                i <= step ? "bg-gradient-brand" : "bg-white/10"
              }`}
            />
            <span
              className={`text-xs ${i === step ? "text-foreground" : "text-muted/60"}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <div className="space-y-5">
              <Header
                icon={<Navigation className="h-5 w-5" />}
                title="Welcome to Easy Ride"
                subtitle="Let’s set up your AI travel agent. First, what should we call you?"
              />
              <Field label="Your name">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  autoFocus
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <Header
                icon={<Home className="h-5 w-5" />}
                title="Your saved places"
                subtitle="So you can say “take me home” and your agent just knows."
              />
              <Field label="Home address">
                <Input
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  placeholder="123 Market St, San Francisco"
                />
              </Field>
              <Field label="Work address (optional)">
                <Input
                  value={workAddress}
                  onChange={(e) => setWorkAddress(e.target.value)}
                  placeholder="1 Office Plaza, San Francisco"
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Header
                icon={<Scale className="h-5 w-5" />}
                title="How should your agent ride?"
                subtitle="You can change any of this later."
              />
              <div>
                <p className="mb-2 text-sm font-medium text-muted">
                  When booking, prefer
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {GOAL_OPTIONS.map((opt) => (
                    <OptionCard
                      key={opt.value}
                      selected={goal === opt.value}
                      onSelect={() => setGoal(opt.value)}
                      title={opt.title}
                      description={opt.description}
                      icon={opt.icon}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Daily budget ($)">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="decimal"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(e.target.value)}
                  />
                </Field>
                <Field label="Max per ride ($)">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="decimal"
                    value={maxRide}
                    onChange={(e) => setMaxRide(e.target.value)}
                  />
                </Field>
              </div>

              <div className="space-y-3">
                <Switch
                  checked={ev}
                  onChange={setEv}
                  label="Prefer electric vehicles"
                  description="Greener rides when available"
                  icon={<Zap className="h-5 w-5 text-teal" />}
                />
                <Switch
                  checked={premium}
                  onChange={setPremium}
                  label="Prefer premium rides"
                  description="Higher-end vehicles"
                  icon={<Crown className="h-5 w-5 text-violet" />}
                />
                <Switch
                  checked={shared}
                  onChange={setShared}
                  label="Allow shared rides"
                  description="Cheaper trips you may share with others"
                  icon={<Users className="h-5 w-5 text-indigo" />}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Header
                icon={<Check className="h-5 w-5" />}
                title="All set?"
                subtitle="Here’s what your agent will use. Finish to start riding."
              />
              <div className="glass space-y-3 rounded-2xl p-5 text-sm">
                <Row label="Name" value={fullName || "—"} />
                <Row label="Home" value={homeAddress || "—"} />
                <Row label="Work" value={workAddress || "Not set"} />
                <Row
                  label="Preference"
                  value={GOAL_OPTIONS.find((g) => g.value === goal)?.title ?? goal}
                />
                <Row label="Daily budget" value={`$${dailyBudget}`} />
                <Row label="Max per ride" value={`$${maxRide}`} />
                <Row
                  label="Ride styles"
                  value={
                    [ev && "EV", premium && "Premium", shared && "Shared"]
                      .filter(Boolean)
                      .join(", ") || "Standard"
                  }
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {state.error ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-3 py-2.5 text-sm text-[#ff9bab]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <Button
            type="button"
            variant="gradient"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" variant="gradient" disabled={pending}>
            {pending ? "Setting up…" : "Finish setup"}
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}

function Header({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-white">
        {icon}
      </span>
      <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-1 text-muted">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
