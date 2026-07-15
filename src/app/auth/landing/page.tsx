"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Target of the magic-link email. The Supabase browser client auto-detects
// the session from the URL (hash fragment or ?code=) on creation; we just
// wait for that to resolve and then hand off to the server-rendered "/"
// which routes by role.
export default function AuthLandingPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const resolvedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        resolvedRef.current = true;
        router.replace("/");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        resolvedRef.current = true;
        router.replace("/");
      }
    });

    const timeout = setTimeout(() => {
      if (!resolvedRef.current) setFailed(true);
    }, 6000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="auth-shell">
      <div className="login-card" style={{ textAlign: "center" }}>
        <div className="login-mark" style={{ margin: "0 auto 14px" }}>
          SA
        </div>
        {failed ? (
          <>
            <h1>Link expired</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              That sign-in link is no longer valid. Request a new one from the login page.
            </p>
            <a href="/login" className="btn btn-primary btn-block" style={{ marginTop: 16, display: "block" }}>
              Back to sign in
            </a>
          </>
        ) : (
          <>
            <h1>Signing you in…</h1>
            <p className="muted" style={{ marginTop: 8 }}>One moment.</p>
          </>
        )}
      </div>
    </div>
  );
}
