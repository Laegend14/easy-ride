"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EasyRide GlobalError Caught]:", error);
  }, [error]);

  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex items-center justify-center bg-[#0a0d14] text-white p-4">
        <div className="max-w-md w-full rounded-3xl bg-white/[0.03] border border-white/10 p-8 text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">System Notice</h1>
            <p className="text-sm text-gray-400">
              The application encountered an unexpected issue while loading.
            </p>
            {error?.digest && (
              <p className="text-xs font-mono text-gray-500">ID: {error.digest}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 text-black font-semibold py-3 px-4 transition hover:bg-teal-400 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Try again</span>
            </button>
            <a
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 text-white font-medium py-3 px-4 transition hover:bg-white/10 cursor-pointer"
            >
              Return to Easy Ride
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
