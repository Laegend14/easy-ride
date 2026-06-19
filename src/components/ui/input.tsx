import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition placeholder:text-muted/60 focus:border-transparent focus:ring-2 focus:ring-indigo/60 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
