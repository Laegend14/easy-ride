import { Route, ShieldCheck, Lock, Navigation } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal } from "./reveal";

const FEATURES = [
  {
    icon: Route,
    title: "AI compares every provider",
    body: "One search checks every ride option around you and picks the best price and arrival time — automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Protected Payment",
    body: "Your money is held safely and only released when your ride is complete. No upfront risk, ever.",
  },
  {
    icon: Lock,
    title: "Secure Ride Lock",
    body: "Your fare is locked in the moment you book — no surprise surge pricing when it’s time to pay.",
  },
  {
    icon: Navigation,
    title: "Live ride tracking",
    body: "Watch your driver approach in real time and get smart updates the whole way there.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Built to feel <span className="text-gradient">effortless.</span>
        </h2>
        <p className="mt-4 text-lg text-muted">
          Smart booking and protected payments, wrapped in an experience that
          just works.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.title} delay={(i % 2) * 0.1}>
            <GlassCard className="flex h-full items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white">
                <feature.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-muted">{feature.body}</p>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
