import { AuthForm } from "@/components/auth/auth-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 text-muted">
        Sign in and let your AI agent handle the ride.
      </p>

      <div className="mt-6">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
