import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

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
