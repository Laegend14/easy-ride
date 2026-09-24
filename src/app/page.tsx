import { AuroraBackground } from "@/components/ui/aurora-background";
import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";

export default function Home() {
  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      <AuroraBackground />
      <SiteHeader />
      <main className="flex-1 overflow-hidden">
        <Hero />
      </main>
    </div>
  );
}
