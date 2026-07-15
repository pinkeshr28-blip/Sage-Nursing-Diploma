"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { completeInvite } from "@/lib/actions/auth";

export default function AcceptInvitePage() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const resolvedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        resolvedRef.current = true;
        setEmail(session.user.email ?? "");
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        resolvedRef.current = true;
        setEmail(data.session.user.email ?? "");
        setReady(true);
      }
    });

    const timeout = setTimeout(() => {
      if (!resolvedRef.current) setFailed(true);
    }, 6000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await completeInvite(fullName);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="auth-shell">
      <div className="login-card">
        <div className="login-mark">SA</div>
        <h1>Welcome to SAGE Academy</h1>
        <div className="sub">Finish setting up your account</div>

        {!ready && !failed && (
          <p className="muted">Confirming your invite…</p>
        )}

        {failed && (
          <>
            <p className="muted">
              That invite link is no longer valid. Ask your admin to send a new one, or sign
              in below if you&apos;ve already set up your account.
            </p>
            <a href="/login" className="btn btn-primary btn-block" style={{ marginTop: 14, display: "block" }}>
              Go to sign in
            </a>
          </>
        )}

        {ready && (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input value={email} disabled />
            </div>
            <div className="field">
              <label htmlFor="fullName">Your full name</label>
              <input
                id="fullName"
                required
                autoFocus
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={isPending}>
              {isPending ? "Setting up…" : "Continue"}
            </button>
            {error && <div className="error-text">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
