import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Glassmorphism panel. `gradientBorder` adds a subtle teal->violet edge.
 */
export function GlassCard({
  className,
  gradientBorder = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { gradientBorder?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6",
        gradientBorder ? "glass-gradient-border" : "glass",
        className,
      )}
      {...props}
    />
  );
}
