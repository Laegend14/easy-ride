"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(auth)/actions";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NAV_ITEMS } from "./nav-items";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen">
      {/* Desktop sidebar */}
      <aside className="glass fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 p-4 md:flex">
        <div className="flex items-center justify-between px-2 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="Easy Ride Logo" className="h-8 w-8 rounded-xl object-cover" />
            <span className="font-display text-lg font-semibold tracking-tight">
              Easy<span className="text-gradient">Ride</span>
            </span>
          </Link>
          <NotificationBell />
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gradient-brand text-white shadow-lg shadow-indigo/20"
                    : "text-muted hover:bg-white/5 hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="truncate px-3 text-xs text-muted">{email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="Easy Ride Logo" className="h-7 w-7 rounded-lg object-cover" />
          <span className="font-display font-semibold tracking-tight">
            Easy<span className="text-gradient">Ride</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Sign out"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pb-28 pt-20 md:ml-64 md:px-10 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                active ? "text-foreground" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl transition-colors",
                  active ? "bg-gradient-brand text-white" : "",
                )}
              >
                <item.icon className="h-5 w-5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
