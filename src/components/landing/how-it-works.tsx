import { MessageSquare, Sparkles, CarFront } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal } from "./reveal";

const STEPS = [
  {
    icon: MessageSquare,
    title: "Just ask",
    body: "Type or speak where you want to go — “Take me to the airport.” No forms, no fuss.",
  },
  {
    icon: Sparkles,
    title: "AI books the best ride",
    body: "Easy Ride compares every provider for price and arrival time, then books the smartest option.",
  },
  {
    icon: CarFront,
    title: "Ride & relax",
    body: "Your payment is protected and settles automatically the moment you arrive. That’s it.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          One sentence. <span className="text-gradient">Done.</span>
        </h2>
        <p className="mt-4 text-lg text-muted">
          Getting a ride should be as simple as asking. Here’s how Easy Ride
          works.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.1}>
            <GlassCard className="h-full" gradientBorder>
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-white">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-2xl font-semibold text-muted/60">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-muted">{step.body}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
