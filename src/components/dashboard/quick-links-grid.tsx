"use client";

import Link from "next/link";
import { Clock, TrendingUp, Activity, Star, ArrowUpRight } from "lucide-react";

interface QuickLinkItem {
  href: string;
  label: string;
  subtitle: string;
  tag: string;
  icon: typeof Clock;
  gradient: string;
  glow: string;
  borderHover: string;
  iconBg: string;
  iconColor: string;
}

const QUICK_LINKS: QuickLinkItem[] = [
  {
    href: "/activity",
    label: "Trip History",
    subtitle: "Past routes & receipts",
    tag: "Activity",
    icon: Clock,
    gradient: "from-teal/10 via-teal/5 to-transparent",
    glow: "group-hover:shadow-teal/20",
    borderHover: "hover:border-teal/40",
    iconBg: "bg-teal/10 text-teal border-teal/20",
    iconColor: "text-teal",
  },
  {
    href: "/analytics",
    label: "Ride Insights",
    subtitle: "Savings & commute trends",
    tag: "Analytics",
    icon: TrendingUp,
    gradient: "from-violet/10 via-violet/5 to-transparent",
    glow: "group-hover:shadow-violet/20",
    borderHover: "hover:border-violet/40",
    iconBg: "bg-violet/10 text-violet border-violet/20",
    iconColor: "text-violet",
  },
  {
    href: "/balance",
    label: "Escrow Ledger",
    subtitle: "On-chain smart settlements",
    tag: "CCTP Logs",
    icon: Activity,
    gradient: "from-indigo/10 via-indigo/5 to-transparent",
    glow: "group-hover:shadow-indigo/20",
    borderHover: "hover:border-indigo/40",
    iconBg: "bg-indigo/10 text-indigo border-indigo/20",
    iconColor: "text-indigo",
  },
  {
    href: "/settings",
    label: "Preferences",
    subtitle: "Security & notification setup",
    tag: "Settings",
    icon: Star,
    gradient: "from-amber-400/10 via-amber-400/5 to-transparent",
    glow: "group-hover:shadow-amber-400/20",
    borderHover: "hover:border-amber-400/40",
    iconBg: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    iconColor: "text-amber-400",
  },
];

export function QuickLinksGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {QUICK_LINKS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface/50 p-4 transition-all duration-300 hover:bg-surface/80 hover:shadow-xl ${item.borderHover} ${item.glow} flex flex-col justify-between`}
          >
            {/* Subtle background ambient gradient on hover */}
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            <div className="relative z-10 flex items-start justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105 ${item.iconBg}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-muted/70 uppercase tracking-wider hidden sm:inline">
                  {item.tag}
                </span>
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-muted group-hover:text-foreground group-hover:bg-white/10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <h4 className="font-display font-bold text-xs sm:text-sm text-foreground group-hover:text-white transition">
                {item.label}
              </h4>
              <p className="text-[11px] text-muted line-clamp-1 mt-0.5 font-normal">
                {item.subtitle}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
