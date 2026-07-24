import { requireRole } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { AppShell } from "@/components/AppShell";

const TABS = [
  { href: "/admin/people", label: "Students & assessors" },
  { href: "/admin/config", label: "Curriculum config" },
  { href: "/admin/matrix", label: "All candidates" },
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/inbox", label: "Notification log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("admin");
  const unreadCount = await getUnreadNotificationCount(profile.id);

  return (
    <AppShell name={profile.full_name ?? profile.email} role="admin" tabs={TABS} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
