import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getUnreadNotificationCount(profileId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("to_profile_id", profileId)
    .is("read_at", null);

  return count ?? 0;
}

/** Marks every unread notification addressed to this profile as read. */
export async function markAllNotificationsRead(profileId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("to_profile_id", profileId)
    .is("read_at", null);
}
