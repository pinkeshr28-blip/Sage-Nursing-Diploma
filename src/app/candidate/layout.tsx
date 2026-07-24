import { requireRole } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { AppShell } from "@/components/AppShell";

const TABS = [
  { href: "/candidate/assessments", label: "My assessments" },
  { href: "/candidate/inbox", label: "My notifications" },
];

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("candidate");
  const unreadCount = await getUnreadNotificationCount(profile.id);

  return (
    <AppShell name={profile.full_name ?? profile.email} role="candidate" tabs={TABS} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
