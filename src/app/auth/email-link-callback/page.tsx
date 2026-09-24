"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function EmailLinkCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "need_email" | "success" | "error">("verifying");
  const [emailInput, setEmailInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function processLink(providedEmail?: string) {
      try {
        const auth = getFirebaseAuth();
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          setStatus("error");
          setErrorMessage("This sign-in link is invalid or has expired.");
          return;
        }

        let email = providedEmail || window.localStorage.getItem("emailForSignIn");

        if (!email) {
          setStatus("need_email");
          return;
        }

        const result = await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem("emailForSignIn");

        // Exchange for session cookie
        const idToken = await result.user.getIdToken();
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to set up session");
        }

        setStatus("success");
        setTimeout(() => {
          if (data.onboardingCompleted) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        }, 1200);
      } catch (err: any) {
        console.error("Email link sign-in error:", err);
        setStatus("error");
        setErrorMessage(err.message || "Failed to verify sign-in link. Please request a new one.");
      }
    }

    processLink();
  }, [router]);

  async function handleConfirmEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubmitting(true);
    setStatus("verifying");

    try {
      const auth = getFirebaseAuth();
      const result = await signInWithEmailLink(auth, emailInput.trim(), window.location.href);
      window.localStorage.removeItem("emailForSignIn");

      const idToken = await result.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus("success");
      setTimeout(() => {
        if (data.onboardingCompleted) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }, 1200);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to authenticate with provided email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20">
      <AuroraBackground />

      <div className="glass-gradient-border w-full max-w-md rounded-3xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <img src="/logo.png" alt="Easy Ride Logo" className="h-10 w-10 rounded-xl object-cover" />
        </div>

        {status === "verifying" && (
          <div className="space-y-4 py-6">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal" />
            <h2 className="text-xl font-bold font-display">Verifying your sign-in link…</h2>
            <p className="text-sm text-muted">Securing your session with Firebase.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-6">
            <CheckCircle2 className="mx-auto h-10 w-10 text-teal" />
            <h2 className="text-xl font-bold font-display">Welcome to Easy Ride!</h2>
            <p className="text-sm text-muted">Redirecting you to your dashboard…</p>
          </div>
        )}

        {status === "need_email" && (
          <form onSubmit={handleConfirmEmail} className="space-y-4 text-left">
            <div>
              <h2 className="text-lg font-bold font-display">Confirm your email</h2>
              <p className="text-sm text-muted">
                Please enter the email address you requested the sign-in link with.
              </p>
            </div>
            <Input
              type="email"
              placeholder="you@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              autoFocus
            />
            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirming…" : "Continue"}
            </Button>
          </form>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4">
            <AlertCircle className="mx-auto h-10 w-10 text-[#ff6e84]" />
            <h2 className="text-xl font-bold font-display">Sign-in Link Error</h2>
            <p className="text-sm text-[#ff9bab]">{errorMessage}</p>
            <Button
              variant="glass"
              className="w-full mt-4"
              onClick={() => router.push("/login")}
            >
              Back to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
