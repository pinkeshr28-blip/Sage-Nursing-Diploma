"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InactivePage() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="auth-shell">
      <div className="login-card">
        <div className="login-mark">SA</div>
        <h1>Account deactivated</h1>
        <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
          Your account has been deactivated. Please contact your admin if you think this is a
          mistake.
        </p>
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
