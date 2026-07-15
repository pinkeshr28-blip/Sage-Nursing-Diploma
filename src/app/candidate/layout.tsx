import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

const TABS = [
  { href: "/candidate/assessments", label: "My assessments" },
  { href: "/candidate/inbox", label: "My notifications" },
];

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("candidate");

  return (
    <AppShell name={profile.full_name ?? profile.email} role="candidate" tabs={TABS}>
      {children}
    </AppShell>
  );
}
