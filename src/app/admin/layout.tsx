import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

const TABS = [
  { href: "/admin/people", label: "Students & assessors" },
  { href: "/admin/config", label: "Curriculum config" },
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/inbox", label: "Notification log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("admin");

  return (
    <AppShell name={profile.full_name ?? profile.email} role="admin" tabs={TABS}>
      {children}
    </AppShell>
  );
}
