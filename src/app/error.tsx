"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EasyRide ErrorBoundary Caught]:", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <div className="glass-gradient-border max-w-md w-full rounded-3xl p-8 space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff6e84]/15 border border-[#ff6e84]/30 text-[#ff6e84]">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Something went wrong
          </h1>
          <p className="text-sm text-muted">
            {error?.message && !error.message.includes("digest")
              ? error.message
              : "An unexpected error occurred while loading this page. Please try again."}
          </p>
          {error?.digest && (
            <p className="text-[11px] font-mono text-muted/60">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="button"
            variant="gradient"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => reset()}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try again</span>
          </Button>

          <Link href="/" className="w-full">
            <Button
              type="button"
              variant="glass"
              size="lg"
              className="w-full flex items-center justify-center gap-2 border border-white/10"
            >
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
