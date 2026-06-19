import { GlassCard } from "@/components/ui/glass-card";
import { Reveal } from "./reveal";

const STATS = [
  { value: "10k+", label: "rides booked" },
  { value: "4.9", label: "average rating" },
  { value: "30s", label: "average booking" },
];

export function TrustSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <Reveal>
        <GlassCard className="px-6 py-10" gradientBorder>
          <div className="grid gap-8 text-center sm:grid-cols-3">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-5xl font-bold text-gradient">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm uppercase tracking-wider text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </Reveal>
    </section>
  );
}
