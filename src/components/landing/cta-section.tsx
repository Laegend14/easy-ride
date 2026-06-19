import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function CtaSection() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-24">
      <Reveal>
        <div className="aurora-mesh glass relative overflow-hidden rounded-3xl px-6 py-20 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Ready to <span className="text-gradient">ride?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Join thousands letting their AI agent handle the ride. Free to start
            — no card needed.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button variant="gradient" size="lg">
                Get started free
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="glass" size="lg">
                See how it works
              </Button>
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
