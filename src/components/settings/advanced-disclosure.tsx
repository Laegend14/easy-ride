"use client";

import { useState } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Row = { label: string; value: string };

/**
 * The ONE place technical/network details are shown. Collapsed by default.
 * Everything else in the app stays Web2-first.
 */
export function AdvancedDisclosure({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span>
          <span className="block font-medium text-foreground">Advanced</span>
          <span className="block text-sm text-muted">
            Technical payment details for developers
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-white/10 px-5 py-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted">{row.label}</span>
              <button
                type="button"
                onClick={() => copy(row.value)}
                className="flex items-center gap-2 font-mono text-xs text-foreground/80 hover:text-foreground"
                title="Copy"
              >
                <span className="max-w-[220px] truncate">{row.value}</span>
                {copied === row.value ? (
                  <Check className="h-3.5 w-3.5 text-teal" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
