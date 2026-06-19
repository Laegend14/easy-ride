"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptionCard({
  selected,
  onSelect,
  title,
  description,
  icon,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative rounded-2xl p-4 text-left transition",
        selected ? "glass-gradient-border" : "glass hover:bg-white/10",
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
              selected ? "bg-gradient-brand text-white" : "bg-white/5 text-foreground",
            )}
          >
            {icon}
          </span>
        ) : null}
        <div className="flex-1">
          <span className="block font-medium text-foreground">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-sm text-muted">{description}</span>
          ) : null}
        </div>
        {selected ? (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-brand text-white">
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
    </button>
  );
}
