"use client";

import { useState } from "react";
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
  unreadCount = 0,
  children,
}: {
  name: string;
  role: string;
  tabs: TabDef[];
  unreadCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const inboxTab = tabs.find((t) => t.href.includes("inbox"));

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
        {tabs.map((t) => {
          const isInbox = t.href.includes("inbox");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={pathname === t.href || pathname?.startsWith(t.href + "/") ? "active" : ""}
            >
              {t.label}
              {isInbox && unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </Link>
          );
        })}
      </div>
      {unreadCount > 0 && !bannerDismissed && inboxTab && (
        <div className="notif-banner">
          <span>
            🔔 You have {unreadCount} new notification{unreadCount === 1 ? "" : "s"}.
          </span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href={inboxTab.href} className="btn btn-sm btn-gold">
              View
            </Link>
            <button
              className="notif-banner-dismiss"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="wrap">{children}</div>
    </div>
  );
}
