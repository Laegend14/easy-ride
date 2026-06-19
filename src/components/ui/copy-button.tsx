"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className || "p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition shrink-0"}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-teal" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}
