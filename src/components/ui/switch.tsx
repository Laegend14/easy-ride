"use client";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="glass flex w-full items-center gap-3 rounded-2xl p-4 text-left transition hover:bg-white/10"
    >
      {icon ? (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-foreground">
          {icon}
        </span>
      ) : null}
      <span className="flex-1">
        <span className="block font-medium text-foreground">{label}</span>
        {description ? (
          <span className="block text-sm text-muted">{description}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-gradient-brand" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
