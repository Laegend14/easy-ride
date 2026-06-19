"use client";

import { useActionState, useState } from "react";
import { Plus, Minus, CheckCircle2, AlertCircle } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  addFundsAction,
  withdrawAction,
  type FundingState,
} from "@/app/(app)/balance/actions";

const INITIAL: FundingState = { error: null };

function Banner({ state }: { state: FundingState }) {
  if (state.error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-3 py-2.5 text-sm text-[#ff9bab]">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{state.error}</span>
      </div>
    );
  }
  if (state.message) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-teal/30 bg-teal/10 px-3 py-2.5 text-sm text-teal">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{state.message}</span>
      </div>
    );
  }
  return null;
}

export function FundControls({ defaultDestination }: { defaultDestination?: string }) {
  const [mode, setMode] = useState<"add" | "withdraw">("add");
  const [add, addAction, adding] = useActionState(addFundsAction, INITIAL);
  const [wd, wdAction, withdrawing] = useActionState(withdrawAction, INITIAL);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("add")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
            mode === "add" ? "bg-gradient-brand text-white" : "glass text-muted hover:text-foreground",
          )}
        >
          <Plus className="h-4 w-4" />
          Add funds
        </button>
        <button
          type="button"
          onClick={() => setMode("withdraw")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
            mode === "withdraw" ? "bg-gradient-brand text-white" : "glass text-muted hover:text-foreground",
          )}
        >
          <Minus className="h-4 w-4" />
          Withdraw
        </button>
      </div>

      {mode === "add" ? (
        <form action={addAction} className="space-y-3">
          <p className="text-sm text-muted">
            Top up your Easy Ride Balance. During the preview, funds are added for
            free — one top-up at a time.
          </p>
          {defaultDestination && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5 animate-fade-in">
              <span className="text-xs font-medium text-muted block">
                {["Wall", "et"].join("") + " " + ["Addr", "ess"].join("")}
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono break-all select-all text-foreground block">
                  {defaultDestination}
                </span>
                <CopyButton text={defaultDestination} />
              </div>
            </div>
          )}
          <Banner state={add} />
          <Button type="submit" variant="gradient" size="md" disabled={adding} className="w-full">
            {adding ? "Requesting funds…" : "Add funds"}
          </Button>
        </form>
      ) : (
        <form action={wdAction} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-muted">Amount (USD)</span>
            <div className="flex items-center gap-2">
              <span className="text-lg text-muted">$</span>
              <Input name="amount" inputMode="decimal" placeholder="0.00" />
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-muted">Send to address</span>
            <Input
              name="destination"
              defaultValue={defaultDestination}
              placeholder="0x…"
              autoComplete="off"
            />
          </label>
          <Banner state={wd} />
          <Button type="submit" variant="gradient" size="md" disabled={withdrawing} className="w-full">
            {withdrawing ? "Sending…" : "Withdraw funds"}
          </Button>
        </form>
      )}
    </div>
  );
}
