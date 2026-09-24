"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Mail, KeyRound } from "lucide-react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, signup, establishGoogleSession, type AuthState } from "@/app/(auth)/actions";

const INITIAL: AuthState = { error: null };

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isLogin = mode === "login";

  // Auth method: "password" or "email_link"
  const [authMethod, setAuthMethod] = useState<"password" | "email_link">("password");

  // Client-side states for Google & Email Link
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkSending, setLinkSending] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkSentSuccess, setLinkSentSuccess] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Server action for password auth
  const [state, formAction, pending] = useActionState(
    isLogin ? login : signup,
    INITIAL,
  );

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setClientError(null);

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);

      // Establish session directly via server action (infallible, serverless-native)
      const sessionResult = await establishGoogleSession({
        uid: result.user.uid,
        email: result.user.email || "",
        displayName: result.user.displayName || undefined,
      });

      if (sessionResult.error) {
        throw new Error(sessionResult.error);
      }

      if (sessionResult.onboardingCompleted) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setClientError("Google sign-in was cancelled.");
      } else if (err.code === "auth/unauthorized-domain") {
        const domain = typeof window !== "undefined" ? window.location.hostname : "this domain";
        setClientError(
          `Domain "${domain}" is not authorized in Firebase. Please add "${domain}" to Firebase Console → Authentication → Settings → Authorized domains.`
        );
      } else {
        setClientError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSendEmailLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkEmail.trim()) return;

    setLinkSending(true);
    setClientError(null);
    setLinkSentSuccess(false);

    try {
      const auth = getFirebaseAuth();
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/email-link-callback`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, linkEmail.trim(), actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", linkEmail.trim());
      setLinkSentSuccess(true);
    } catch (err: any) {
      console.error("Send email link error:", err);
      if (err.code === "auth/unauthorized-domain") {
        const domain = typeof window !== "undefined" ? window.location.hostname : "this domain";
        setClientError(
          `Domain "${domain}" is not authorized in Firebase. Please add "${domain}" to Firebase Console → Authentication → Settings → Authorized domains.`
        );
      } else {
        setClientError(err.message || "Failed to send sign-in link.");
      }
    } finally {
      setLinkSending(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* 1. Continue with Google */}
      <Button
        type="button"
        variant="glass"
        size="lg"
        className="w-full flex items-center justify-center gap-3 font-medium bg-white/[0.04] hover:bg-white/[0.09] border border-white/10"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || linkSending || pending}
      >
        {googleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-teal" />
        ) : (
          <GoogleIcon />
        )}
        <span>Continue with Google</span>
      </Button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-white/10 w-full" />
        <span className="bg-[#0b0f17] px-3 text-xs uppercase tracking-wider text-muted shrink-0">
          or continue with
        </span>
        <div className="border-t border-white/10 w-full" />
      </div>

      {/* Method Switcher: Password vs Email Link */}
      <div className="grid grid-cols-2 rounded-xl bg-white/[0.04] p-1 border border-white/10">
        <button
          type="button"
          onClick={() => {
            setAuthMethod("password");
            setClientError(null);
          }}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition ${
            authMethod === "password"
              ? "bg-white/15 text-white shadow-sm"
              : "text-muted hover:text-white"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>Password</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod("email_link");
            setClientError(null);
          }}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition ${
            authMethod === "email_link"
              ? "bg-white/15 text-white shadow-sm"
              : "text-muted hover:text-white"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Email Link</span>
        </button>
      </div>

      {/* Error banner */}
      {(clientError || state.error) && (
        <div className="flex items-start gap-2 rounded-xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-3 py-2.5 text-sm text-[#ff9bab]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{clientError || state.error}</span>
        </div>
      )}

      {/* Mode A: Password Authentication */}
      {authMethod === "password" && (
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-muted">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-muted">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={isLogin ? undefined : 8}
              placeholder={isLogin ? "••••••••" : "At least 8 characters"}
            />
          </div>

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full"
            disabled={pending || googleLoading}
          >
            {pending
              ? isLogin
                ? "Signing in…"
                : "Creating account…"
              : isLogin
                ? "Sign in with password"
                : "Create account"}
          </Button>
        </form>
      )}

      {/* Mode B: Email Link (Passwordless) */}
      {authMethod === "email_link" && (
        <form onSubmit={handleSendEmailLink} className="space-y-4">
          {linkSentSuccess ? (
            <div className="space-y-3 rounded-2xl border border-teal/30 bg-teal/10 p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-teal" />
              <div className="text-sm font-medium text-white">
                Check your inbox!
              </div>
              <p className="text-xs text-muted">
                We sent a secure sign-in link to <span className="text-teal font-mono">{linkEmail}</span>. Tap the link in your email to sign in immediately without a password.
              </p>
              <Button
                type="button"
                variant="glass"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setLinkSentSuccess(false)}
              >
                Send to another email
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label htmlFor="linkEmail" className="text-sm font-medium text-muted">
                  Your email address
                </label>
                <Input
                  id="linkEmail"
                  name="linkEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={linkSending || googleLoading}
              >
                {linkSending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending link…
                  </span>
                ) : (
                  "Send sign-in link"
                )}
              </Button>
            </>
          )}
        </form>
      )}

      {/* Footer Navigation */}
      <p className="pt-2 text-center text-sm text-muted">
        {isLogin ? (
          <>
            New to Easy Ride?{" "}
            <Link href="/signup" className="font-medium text-gradient">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-gradient">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
