"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface TabDef {
  href: string;
  label: string;
}

export function AppShell({
  name,
  role,
  tabs,
  children,
}: {
  name: string;
  role: string;
  tabs: TabDef[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div>
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">SA</div>
          <div>
            <h1>SAGE Academy</h1>
            <span>Assessment Platform</span>
          </div>
        </div>
        <div className="who">
          <span className="name">{name}</span>
          <span className="role">{role}</span>
          <button className="logout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
      <div className="tabs">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={pathname === t.href || pathname?.startsWith(t.href + "/") ? "active" : ""}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <div className="wrap">{children}</div>
    </div>
  );
}
