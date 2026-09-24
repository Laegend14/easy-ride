import "server-only";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import type { NotificationType } from "@/types/database";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationFeed {
  items: NotificationItem[];
  unread: number;
}

export async function getNotificationFeed(_limit = 20): Promise<NotificationFeed> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return { items: [], unread: 0 };

  // System welcome notification
  const items: NotificationItem[] = [
    {
      id: "welcome-1",
      type: "ride_booked",
      title: "Welcome to Easy Ride",
      body: "Your autonomous mobility agent is ready to dispatch rides across top providers.",
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ];

  return { items, unread: items.filter((i) => !i.isRead).length };
}
