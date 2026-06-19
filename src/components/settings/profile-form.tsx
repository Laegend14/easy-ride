"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile, type SettingsState } from "@/app/(app)/settings/actions";
import { SaveBanner } from "./save-banner";

const INITIAL: SettingsState = { error: null };

export function ProfileForm({
  fullName,
  email,
  homeAddress,
  workAddress,
}: {
  fullName: string;
  email: string;
  homeAddress: string;
  workAddress: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, INITIAL);

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-muted">Name</span>
        <Input name="fullName" defaultValue={fullName} placeholder="Your name" />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-muted">Email</span>
        <Input value={email} disabled readOnly />
        <span className="text-xs text-muted/70">
          Contact support to change your email.
        </span>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-muted">Home address</span>
        <Input name="homeAddress" defaultValue={homeAddress} placeholder="Home" />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-muted">Work address</span>
        <Input name="workAddress" defaultValue={workAddress} placeholder="Work" />
      </label>

      <SaveBanner state={state} />
      <Button type="submit" variant="gradient" size="md" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
