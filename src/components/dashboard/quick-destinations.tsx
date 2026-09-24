"use client";

import Link from "next/link";
import { ArrowRight, Navigation } from "lucide-react";

interface DestinationItem {
  title: string;
  subtitle: string;
  query: string;
  emoji: string;
  estTime: string;
  estFare: string;
  badge?: string;
}

const FREQUENT_PLACES: DestinationItem[] = [
  {
    title: "Home",
    subtitle: "Quick evening return",
    query: "Take me Home",
    emoji: "🏠",
    estTime: "12 min",
    estFare: "~$14",
    badge: "Saved",
  },
  {
    title: "Work / Office",
    subtitle: "Financial District",
    query: "Ride to Financial District office",
    emoji: "💼",
    estTime: "18 min",
    estFare: "~$22",
  },
  {
    title: "SFO Airport",
    subtitle: "International Terminal 2",
    query: "SFO Airport Terminal 2",
    emoji: "✈️",
    estTime: "24 min",
    estFare: "~$38",
    badge: "Flat Rate",
  },
  {
    title: "Downtown Plaza",
    subtitle: "Market St & 4th",
    query: "Market Street Downtown",
    emoji: "🏙️",
    estTime: "8 min",
    estFare: "~$11",
  },
];

export function QuickDestinations({ hasCompletedRides = false }: { hasCompletedRides?: boolean }) {
  return (
    <div className="space-y-4">
      {/* Quick Destinations Grid */}
      <div className="rounded-3xl border border-white/10 bg-surface/50 backdrop-blur-md p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-foreground">
                Frequent Destinations
              </h3>
              <p className="text-[11px] text-muted">1-tap instant AI booking</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-teal bg-teal/10 px-2.5 py-0.5 rounded-full border border-teal/20">
            Fast Track
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FREQUENT_PLACES.map((item) => (
            <Link
              key={item.title}
              href={`/ride?q=${encodeURIComponent(item.query)}`}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 hover:border-teal/30 hover:bg-white/[0.06] transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                {item.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-semibold text-foreground text-xs sm:text-sm truncate group-hover:text-teal transition">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded-md shrink-0">
                    {item.estFare}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-muted text-[11px]">
                  <span className="truncate">{item.subtitle}</span>
                  <span className="text-white/20">·</span>
                  <span className="shrink-0">{item.estTime}</span>
                </div>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-muted/40 group-hover:text-teal group-hover:translate-x-0.5 transition shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
