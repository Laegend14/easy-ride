"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getNotificationFeed, type NotificationFeed } from "./queries";

/** Poll target for the notification bell. */
export async function fetchNotifications(): Promise<NotificationFeed> {
  return getNotificationFeed();
}

/** Mark all of the user's unread notifications as read. */
export async function markAllRead(): Promise<void> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
}
