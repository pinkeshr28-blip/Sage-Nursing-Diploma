"use client";

import { useRef, useState, useTransition } from "react";
import { COHORTS } from "@/lib/cohorts";
import { inviteUser } from "@/lib/actions/admin";

export function InviteForm() {
  const [role, setRole] = useState<"assessor" | "candidate">("candidate");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await inviteUser(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(`Invite sent to ${formData.get("email")}.`);
        formRef.current?.reset();
        setRole("candidate");
      }
    });
  }

  return (
    <div className="card">
      <h2>Invite someone</h2>
      <p className="muted" style={{ marginBottom: 12 }}>
        They&apos;ll get an email to set up their account.
      </p>
      <form ref={formRef} action={handleSubmit}>
        <div className="row-flex" style={{ alignItems: "flex-end", gap: 14 }}>
          <div className="field" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
            <label htmlFor="invite-email">Email address</label>
            <input id="invite-email" name="email" type="email" required placeholder="name@example.com" />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
            <label htmlFor="invite-role">Role</label>
            <select
              id="invite-role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "assessor" | "candidate")}
            >
              <option value="candidate">Candidate</option>
              <option value="assessor">Assessor</option>
            </select>
          </div>
          {role === "candidate" && (
            <div className="field" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
              <label htmlFor="invite-cohort">Cohort</label>
              <select id="invite-cohort" name="cohort_id" required>
                {COHORTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={isPending} style={{ height: 38 }}>
            {isPending ? "Sending…" : "Send invite"}
          </button>
        </div>
        {error && <div className="error-text">{error}</div>}
        {success && <div className="error-text" style={{ color: "var(--sage)" }}>{success}</div>}
      </form>
    </div>
  );
}
