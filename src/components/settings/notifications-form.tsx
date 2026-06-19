"use client";

import { useActionState, useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateNotifications, type SettingsState } from "@/app/(app)/settings/actions";
import { SaveBanner } from "./save-banner";

const INITIAL: SettingsState = { error: null };

export function NotificationsForm({
  rideUpdates,
  savingsReports,
}: {
  rideUpdates: boolean;
  savingsReports: boolean;
}) {
  const [state, action, pending] = useActionState(updateNotifications, INITIAL);
  const [ride, setRide] = useState(rideUpdates);
  const [savings, setSavings] = useState(savingsReports);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="rideUpdates" value={ride ? "on" : "off"} />
      <input type="hidden" name="savingsReports" value={savings ? "on" : "off"} />

      <Switch
        checked={ride}
        onChange={setRide}
        label="Ride updates"
        description="Booking, driver, cancellation and settlement alerts"
        icon={<Bell className="h-5 w-5 text-teal" />}
      />
      <Switch
        checked={savings}
        onChange={setSavings}
        label="Savings reports"
        description="Summaries of what your agent saved you"
        icon={<Sparkles className="h-5 w-5 text-violet" />}
      />

      <SaveBanner state={state} />
      <Button type="submit" variant="gradient" size="md" disabled={pending}>
        {pending ? "Saving…" : "Save notifications"}
      </Button>
    </form>
  );
}
