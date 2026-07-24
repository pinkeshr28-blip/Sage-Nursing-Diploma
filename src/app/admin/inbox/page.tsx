import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/notifications";
import { NotificationList } from "@/components/NotificationList";

export default async function AdminInboxPage() {
  const profile = await getSessionProfile();
  if (profile) await markAllNotificationsRead(profile.id);

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <NotificationList
      title="Full notification log"
      description="Every email sent by the platform — upload confirmations, feedback notices, overdue reminders, and IQA logs."
      items={data ?? []}
    />
  );
}
