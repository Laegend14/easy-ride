import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui/glass-card";

export function StatCard({
  icon,
  value,
  label,
  sublabel,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  sublabel?: string;
}) {
  return (
    <GlassCard gradientBorder className="space-y-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-white">
        {icon}
      </span>
      <div>
        <div className="font-display text-3xl font-bold tracking-tight">{value}</div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {sublabel ? <div className="mt-0.5 text-xs text-muted">{sublabel}</div> : null}
      </div>
    </GlassCard>
  );
}
