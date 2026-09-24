import { CheckCircle2, AlertCircle } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const notice = sp?.notice;
  const error = sp?.error;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 text-muted">
        Sign in and let your AI agent handle the ride.
      </p>

      {notice === "check-email" ? (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-teal/30 bg-teal/10 px-3 py-2.5 text-sm text-teal">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Almost there — check your email and tap the link to confirm your
            account, then sign in.
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-3 py-2.5 text-sm text-[#ff9bab]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>We couldn’t finish that just now. Please sign in again.</span>
        </div>
      ) : null}

      <div className="mt-6">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
