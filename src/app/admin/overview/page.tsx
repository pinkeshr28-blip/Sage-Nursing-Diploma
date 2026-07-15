import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ count: totalCandidates }, { data: items }, { count: iqaCount }, { data: units }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "candidate"),
      supabase.from("submission_items").select("status"),
      supabase.from("iqa_samples").select("*", { count: "exact", head: true }),
      supabase.from("units").select("title,published").order("sort_order"),
    ]);

  const statusCounts = { uploaded: 0, pass: 0, revision_needed: 0, pending: 0, submitted: 0 };
  (items ?? []).forEach((i) => {
    if (i.status === "pass") statusCounts.pass++;
    else if (i.status === "revision_needed") statusCounts.revision_needed++;
    else if (i.status === "uploaded" || i.status === "under_review") statusCounts.pending++;
    if (i.status !== "not_started") statusCounts.submitted++;
  });

  const publishedTitles = (units ?? [])
    .filter((u) => u.published)
    .map((u) => u.title.split(" — ")[0])
    .join(", ");

  return (
    <>
      <div className="stats">
        <div className="stat">
          <div className="num mono">{totalCandidates ?? 0}</div>
          <div className="lbl">Candidates</div>
        </div>
        <div className="stat">
          <div className="num mono">{statusCounts.submitted}</div>
          <div className="lbl">Items submitted</div>
        </div>
        <div className="stat">
          <div className="num mono" style={{ color: "var(--sage)" }}>
            {statusCounts.pass}
          </div>
          <div className="lbl">Passed</div>
        </div>
        <div className="stat">
          <div className="num mono" style={{ color: "var(--coral)" }}>
            {statusCounts.revision_needed}
          </div>
          <div className="lbl">Revision needed</div>
        </div>
        <div className="stat">
          <div className="num mono" style={{ color: "var(--gold)" }}>
            {statusCounts.pending}
          </div>
          <div className="lbl">Awaiting review</div>
        </div>
        <div className="stat">
          <div className="num mono">{iqaCount ?? 0}</div>
          <div className="lbl">IQA samples logged</div>
        </div>
      </div>

      <div className="card">
        <h2>Published units</h2>
        <p className="muted">{publishedTitles || "None yet"}</p>
      </div>
    </>
  );
}
