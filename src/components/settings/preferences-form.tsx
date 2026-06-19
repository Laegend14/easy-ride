"use client";

import { useActionState, useState } from "react";
import { Coins, Zap, Scale, Star, Crown, Users, Wand2, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { OptionCard } from "@/components/ui/option-card";
import { updatePreferences, type SettingsState } from "@/app/(app)/settings/actions";
import { SaveBanner } from "./save-banner";
import type { OptimizationGoal } from "@/types/database";

const INITIAL: SettingsState = { error: null };

const GOALS: { value: OptimizationGoal; title: string; icon: React.ReactNode }[] = [
  { value: "cheapest", title: "Cheapest", icon: <Coins className="h-5 w-5" /> },
  { value: "fastest", title: "Fastest", icon: <Zap className="h-5 w-5" /> },
  { value: "balanced", title: "Balanced", icon: <Scale className="h-5 w-5" /> },
  { value: "highest_rated", title: "Top rated", icon: <Star className="h-5 w-5" /> },
];

const dollars = (cents: number) => (cents / 100).toFixed(2);

export function PreferencesForm(props: {
  optimizationGoal: OptimizationGoal;
  dailyBudgetCents: number;
  maxRideCents: number;
  evPreferred: boolean;
  premiumPreferred: boolean;
  sharedRideAllowed: boolean;
  autoAcceptAlternatives: boolean;
  requireConfirmationBeforeRebooking: boolean;
}) {
  const [state, action, pending] = useActionState(updatePreferences, INITIAL);
  const [goal, setGoal] = useState(props.optimizationGoal);
  const [ev, setEv] = useState(props.evPreferred);
  const [premium, setPremium] = useState(props.premiumPreferred);
  const [shared, setShared] = useState(props.sharedRideAllowed);
  const [autoAccept, setAutoAccept] = useState(props.autoAcceptAlternatives);
  const [confirmRebook, setConfirmRebook] = useState(props.requireConfirmationBeforeRebooking);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="optimizationGoal" value={goal} />
      <input type="hidden" name="ev" value={ev ? "on" : "off"} />
      <input type="hidden" name="premium" value={premium ? "on" : "off"} />
      <input type="hidden" name="shared" value={shared ? "on" : "off"} />
      <input type="hidden" name="autoAccept" value={autoAccept ? "on" : "off"} />
      <input type="hidden" name="confirmRebook" value={confirmRebook ? "on" : "off"} />

      <div>
        <p className="mb-2 text-sm font-medium text-muted">When booking, prefer</p>
        <div className="grid grid-cols-2 gap-3">
          {GOALS.map((g) => (
            <OptionCard
              key={g.value}
              selected={goal === g.value}
              onSelect={() => setGoal(g.value)}
              title={g.title}
              icon={g.icon}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-muted">Daily budget ($)</span>
          <Input name="dailyBudget" type="number" min="1" defaultValue={dollars(props.dailyBudgetCents)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-muted">Max per ride ($)</span>
          <Input name="maxRide" type="number" min="1" defaultValue={dollars(props.maxRideCents)} />
        </label>
      </div>

      <div className="space-y-3">
        <Switch checked={ev} onChange={setEv} label="Prefer electric vehicles" icon={<Zap className="h-5 w-5 text-teal" />} />
        <Switch checked={premium} onChange={setPremium} label="Prefer premium rides" icon={<Crown className="h-5 w-5 text-violet" />} />
        <Switch checked={shared} onChange={setShared} label="Allow shared rides" icon={<Users className="h-5 w-5 text-indigo" />} />
        <Switch
          checked={autoAccept}
          onChange={setAutoAccept}
          label="Auto-accept alternatives"
          description="Let your agent rebook automatically if a driver cancels"
          icon={<Wand2 className="h-5 w-5 text-teal" />}
        />
        <Switch
          checked={confirmRebook}
          onChange={setConfirmRebook}
          label="Confirm before rebooking"
          description="Ask me before switching providers"
          icon={<ShieldQuestion className="h-5 w-5 text-violet" />}
        />
      </div>

      <SaveBanner state={state} />
      <Button type="submit" variant="gradient" size="md" disabled={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
