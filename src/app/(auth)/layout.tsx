import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check Firebase session safely
  try {
    const fbUser = await getCurrentFirebaseUser();
    if (fbUser) redirect("/dashboard");
  } catch (err) {
    console.warn("[AuthLayout] Session check skipped:", err);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20">
      <AuroraBackground />

      <Link
        href="/"
        className="absolute left-6 top-6 flex items-center gap-2"
      >
        <img src="/logo.png" alt="Easy Ride Logo" className="h-8 w-8 rounded-xl object-cover" />
        <span className="font-display text-lg font-semibold tracking-tight">
          Easy<span className="text-gradient">Ride</span>
        </span>
      </Link>

      <div className="glass-gradient-border w-full max-w-md rounded-3xl p-8">
        {children}
      </div>
    </div>
  );
}
