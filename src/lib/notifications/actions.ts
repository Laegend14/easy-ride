"use server";

import { getNotificationFeed, type NotificationFeed } from "./queries";

/** Poll target for the notification bell. */
export async function fetchNotifications(): Promise<NotificationFeed> {
  return getNotificationFeed();
}

/** Mark all of the user's unread notifications as read. */
export async function markAllRead(): Promise<void> {
  // Handled in client state
}
