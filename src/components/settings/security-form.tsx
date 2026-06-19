"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePassword, type SettingsState } from "@/app/(app)/settings/actions";
import { SaveBanner } from "./save-banner";

const INITIAL: SettingsState = { error: null };

export function SecurityForm() {
  const [state, action, pending] = useActionState(updatePassword, INITIAL);

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-muted">New password</span>
        <Input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-muted">Confirm password</span>
        <Input name="confirm" type="password" autoComplete="new-password" placeholder="Re-enter password" />
      </label>

      <SaveBanner state={state} />
      <Button type="submit" variant="gradient" size="md" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
