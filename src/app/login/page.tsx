"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/landing` },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="auth-shell">
      <div className="login-card">
        <div className="login-mark">SA</div>
        <h1>SAGE Academy</h1>
        <div className="sub">Assessment Notification Platform</div>

        {status === "sent" ? (
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>
            Check <strong>{email}</strong> for a sign-in link. It&apos;ll open straight into
            your dashboard — no password needed.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                placeholder="you@sageacademy.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={status === "sending"}>
              {status === "sending" ? "Sending link…" : "Send sign-in link"}
            </button>
            {status === "error" && <div className="error-text">{errorMsg}</div>}
          </form>
        )}

        <div className="hint">
          Accounts are invite-only. If you haven&apos;t received an invite from your admin,
          contact them to get set up.
        </div>
      </div>
    </div>
  );
}
