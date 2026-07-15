import { createClient } from "@/lib/supabase/server";
import { cohortLabel } from "@/lib/cohorts";
import { InviteForm } from "@/components/admin/InviteForm";

export default async function AdminPeoplePage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const candidates = (profiles ?? []).filter((p) => p.role === "candidate");
  const assessors = (profiles ?? []).filter((p) => p.role === "assessor");

  return (
    <>
      <InviteForm />

      <div className="card">
        <h2>Candidates</h2>
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Cohort</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No candidates invited yet.
                </td>
              </tr>
            )}
            {candidates.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.full_name ?? "—"}</td>
                <td className="mono muted">{c.email}</td>
                <td>{cohortLabel(c.cohort_id)}</td>
                <td>
                  <span className={`pill ${c.status === "active" ? "pill-sage" : "pill-gold"}`}>
                    {c.status === "active" ? "Active" : "Invited"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Assessors</h2>
        <p className="muted">
          Assessors can view and mark any cohort — they pick which one to work with after
          signing in.
        </p>
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assessors.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  No assessors invited yet.
                </td>
              </tr>
            )}
            {assessors.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.full_name ?? "—"}</td>
                <td className="mono muted">{a.email}</td>
                <td>
                  <span className={`pill ${a.status === "active" ? "pill-sage" : "pill-gold"}`}>
                    {a.status === "active" ? "Active" : "Invited"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
