import { AuthForm } from "@/components/auth/auth-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Create your account
      </h1>
      <p className="mt-2 text-muted">
        Get started free — no card needed. Just say where you want to go.
      </p>

      <div className="mt-6">
        <AuthForm mode="signup" />
      </div>

      <p className="mt-6 text-center text-xs text-muted/70">
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}
