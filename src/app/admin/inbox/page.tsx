import { createClient } from "@/lib/supabase/server";
import { NotificationList } from "@/components/NotificationList";

export default async function AdminInboxPage() {
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
