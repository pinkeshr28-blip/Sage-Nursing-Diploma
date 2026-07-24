import { requireRole } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { AppShell } from "@/components/AppShell";

const TABS = [
  { href: "/assessor/queue", label: "Review queue" },
  { href: "/assessor/matrix", label: "All candidates" },
  { href: "/assessor/iqa", label: "IQA sampling" },
  { href: "/assessor/inbox", label: "Notifications" },
];

export default async function AssessorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("assessor");
  const unreadCount = await getUnreadNotificationCount(profile.id);

  return (
    <AppShell name={profile.full_name ?? profile.email} role="assessor" tabs={TABS} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
