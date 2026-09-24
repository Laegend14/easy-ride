import { redirect } from "next/navigation";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/firebase/db";
import { ensureWallet } from "@/lib/circle/wallets";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { AppShell } from "@/components/app/app-shell";

import { isDeveloperEmail } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) redirect("/login");

  const [profile] = await Promise.all([
    getUserProfile(fbUser.uid),
    ensureWallet().catch((err) => {
      console.warn("[AppLayout] ensureWallet error:", err);
      return null;
    }),
  ]);

  if (profile && !profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  const isDev = isDeveloperEmail(fbUser.email);

  return (
    <>
      <AuroraBackground />
      <AppShell email={fbUser.email ?? ""} isDev={isDev}>
        {children}
      </AppShell>
    </>
  );
}
