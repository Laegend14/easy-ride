"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AuthError Caught]:", error);
  }, [error]);

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff6e84]/15 border border-[#ff6e84]/30 text-[#ff6e84]">
        <AlertCircle className="h-6 w-6" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-xl font-bold tracking-tight text-white">
          Sign-in unavailable
        </h2>
        <p className="text-sm text-muted">
          We encountered an issue preparing the sign-in form.
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-2">
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

        <Link href="/" className="text-xs text-muted hover:text-white pt-2 transition">
          Return to home
        </Link>
      </div>
    </div>
  );
}
