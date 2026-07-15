import { createClient } from "@/lib/supabase/server";
import { NotificationList } from "@/components/NotificationList";

export default async function CandidateInboxPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <NotificationList
      title="Your notifications"
      description="Every email sent to or from you by the platform."
      items={data ?? []}
    />
  );
}
