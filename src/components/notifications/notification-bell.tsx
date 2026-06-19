"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Bell,
  Car,
  UserCheck,
  XCircle,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchNotifications,
  markAllRead,
} from "@/lib/notifications/actions";
import type { NotificationItem } from "@/lib/notifications/queries";
import type { NotificationType } from "@/types/database";

const ICON: Partial<Record<NotificationType, typeof Car>> = {
  ride_booked: Car,
  driver_assigned: UserCheck,
  driver_cancelled: XCircle,
  alternative_found: RefreshCw,
  settlement_complete: CheckCircle2,
  refund_issued: RotateCcw,
};

const TINT: Partial<Record<NotificationType, string>> = {
  driver_cancelled: "text-[#ff9bab]",
  refund_issued: "text-[#f6c177]",
  alternative_found: "text-violet",
  settlement_complete: "text-teal",
};

function relTime(iso: string) {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Poll for new notifications.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const feed = await fetchNotifications();
        if (alive) {
          setItems(feed.items);
          setUnread(feed.unread);
        }
      } catch {
        // Ignore transient poll failures (e.g. dev server restart).
      }
    };
    load();
    const id = setInterval(load, 12000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
      startTransition(() => {
        markAllRead();
      });
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-brand px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="glass absolute right-0 md:left-full md:right-auto md:top-0 md:ml-3 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 shadow-xl shadow-black/40">
          <div className="border-b border-white/10 px-4 py-3 text-sm font-medium text-foreground">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                You’re all caught up.
              </p>
            ) : (
              items.map((n) => {
                const Icon = ICON[n.type] ?? Bell;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition",
                      !n.isRead && "bg-white/[0.03]",
                    )}
                  >
                    <span className={cn("mt-0.5 shrink-0", TINT[n.type] ?? "text-teal")}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {n.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted/70">
                          {relTime(n.createdAt)}
                        </span>
                      </div>
                      {n.body ? (
                        <p className="text-xs text-muted">{n.body}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
