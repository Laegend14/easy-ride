import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ensureWallet } from "@/lib/circle/wallets";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();
  if (!profile?.onboarding_completed) redirect("/onboarding");

  // Provision the Easy Ride Balance on first entry to any app screen (idempotent).
  await ensureWallet();

  return (
    <>
      <AuroraBackground />
      <AppShell email={user.email ?? ""}>{children}</AppShell>
    </>
  );
}
