"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronDown, ChevronRight, Home, Clock, CircleDollarSign, Gauge, Settings, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AiChatbot } from "@/components/chat/ai-chatbot";
import { getNavItems } from "./nav-items";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

// ─── Desktop dropdown nav ──────────────────────────────────────────────────────
function NavDropdown({ email, isDev = false }: { email: string; isDev?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const navItems = getNavItems(isDev);
  const activeItem = navItems.find(item => isActive(pathname, item.href));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all",
          open
            ? "bg-white/10 border-white/20 text-foreground"
            : "glass border-white/10 text-muted hover:text-foreground hover:bg-white/8"
        )}
      >
        {activeItem
          ? <><activeItem.icon className="h-4 w-4 text-teal" /><span>{activeItem.label}</span></>
          : <span>Menu</span>
        }
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-2 w-52 rounded-2xl border border-white/10 bg-[#111827]/98 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="p-2 space-y-0.5">
              {navItems.map(item => {
                const active = isActive(pathname, item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-gradient-brand text-white shadow-md"
                        : "text-muted hover:bg-white/[0.07] hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.devOnly && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                        DEV
                      </span>
                    )}
                    {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-white/10 px-3 py-3 bg-white/[0.02]">
              <p className="truncate text-[11px] text-muted mb-2 px-1">{email}</p>
              <form action={signOut}>
                <button type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-white/[0.07] hover:text-foreground transition">
                  <LogOut className="h-4 w-4 shrink-0" /> Sign out
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile bottom nav ─────────────────────────────────────────────────────────
const MOBILE_NAV = [
  { label: "Home",     href: "/dashboard", icon: Home },
  { label: "Activity", href: "/activity",  icon: Clock },
  { label: "Balance",  href: "/balance",   icon: CircleDollarSign },
  { label: "Insights", href: "/analytics", icon: Gauge },
  { label: "Settings", href: "/settings",  icon: Settings },
];

function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-[#0d1117]/95 backdrop-blur-2xl border-t border-white/10 safe-pb">
      <div className="grid grid-cols-5">
        {MOBILE_NAV.map(item => {
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 transition-colors">
              <span className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                active ? "bg-gradient-brand text-white shadow-lg shadow-indigo/30" : "text-muted"
              )}>
                <item.icon className="w-4.5 h-4.5" />
              </span>
              <span className={cn("text-[10px] font-semibold", active ? "text-foreground" : "text-muted/60")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ email, isDev = false }: { email: string; isDev?: boolean }) {
  const pathname = usePathname();
  const activeItem = MOBILE_NAV.find(item => isActive(pathname, item.href));

  return (
    <header className="glass fixed inset-x-0 top-0 z-40 border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="EasyRide" className="h-8 w-8 rounded-xl object-cover" />
          <span className="font-display text-lg font-bold tracking-tight hidden sm:block">
            Easy<span className="text-gradient">Ride</span>
          </span>
          {/* Mobile: show current page name */}
          {activeItem && (
            <span className="sm:hidden font-display text-base font-bold text-foreground ml-1">
              {activeItem.label}
            </span>
          )}
        </Link>

        {/* Desktop: dropdown nav */}
        <div className="hidden md:block">
          <NavDropdown email={email} isDev={isDev} />
        </div>

        {/* Right: notifications */}
        <div className="flex items-center gap-1">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export function AppShell({
  email,
  isDev = false,
  children,
}: {
  email: string;
  isDev?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <TopBar email={email} isDev={isDev} />
      {/* pt clears fixed top bar; mobile pb is handled per-page with pb-28 */}
      <main className="px-4 pt-[64px] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <MobileNav />
      <AiChatbot />
    </div>
  );
}
