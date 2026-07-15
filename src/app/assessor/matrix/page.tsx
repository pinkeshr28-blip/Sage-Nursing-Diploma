import { createClient } from "@/lib/supabase/server";
import { COHORTS } from "@/lib/cohorts";
import { CohortPicker } from "@/components/assessor/CohortPicker";
import { UnitPicker } from "@/components/assessor/UnitPicker";
import { itemKey } from "@/lib/itemStatus";
import type { Database } from "@/lib/database.types";

type SubmissionItem = Database["public"]["Tables"]["submission_items"]["Row"];

const CELL_MAP: Record<string, { cls: string; label: string; title: string }> = {
  not_started: { cls: "mc-none", label: "–", title: "Not started" },
  uploaded: { cls: "mc-pending", label: "U", title: "Uploaded, pending review" },
  under_review: { cls: "mc-pending", label: "U", title: "Uploaded, pending review" },
  revision_needed: { cls: "mc-rev", label: "R", title: "Revision needed" },
  pass: { cls: "mc-pass", label: "P", title: "Passed" },
};

export default async function AssessorMatrixPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string; unit?: string }>;
}) {
  const { cohort, unit: unitParam } = await searchParams;
  const cohortId = cohort ?? COHORTS[0].id;
  const supabase = await createClient();

  const [{ data: candidates }, { data: units }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("role", "candidate")
      .eq("cohort_id", cohortId),
    supabase.from("units").select("*").eq("published", true).order("sort_order"),
  ]);

  if (!units || units.length === 0) {
    return (
      <>
        <CohortPicker />
        <div className="card">
          <p className="muted">No units published yet.</p>
        </div>
      </>
    );
  }

  const selectedUnitId = unitParam && units.some((u) => u.id === unitParam) ? unitParam : units[0].id;
  const unit = units.find((u) => u.id === selectedUnitId)!;

  const { data: questions } = await supabase
    .from("unit_questions")
    .select("*")
    .eq("unit_id", selectedUnitId)
    .order("sort_order");

  const kCols = (questions ?? []).filter((q) => q.section === "knowledge");
  const pCols = (questions ?? []).filter((q) => q.section === "performance");

  const candidateIds = (candidates ?? []).map((c) => c.id);
  const { data: items } = candidateIds.length
    ? await supabase
        .from("submission_items")
        .select("*")
        .in("student_id", candidateIds)
        .eq("unit_id", selectedUnitId)
    : { data: [] as SubmissionItem[] };

  const itemMap = new Map<string, SubmissionItem>();
  (items ?? []).forEach((i) => itemMap.set(itemKey(i.unit_id, i.section, i.question_id), i));

  function cell(studentId: string, section: "knowledge" | "performance", questionId: string) {
    const item = itemMap.get(itemKey(selectedUnitId, section, questionId));
    const status = item?.status ?? "not_started";
    const info = CELL_MAP[status];
    return (
      <div className={`matrix-cell ${info.cls}`} title={info.title}>
        {info.label}
      </div>
    );
  }

  return (
    <>
      <CohortPicker />
      <div className="card">
        <h2>All candidates — {unit.title}</h2>
        <p className="muted">P = Pass · R = Revision needed · U = Uploaded, pending · – = not started</p>
      </div>
      <UnitPicker units={units.map((u) => ({ id: u.id, title: u.title }))} selectedUnitId={selectedUnitId} />
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              {kCols.map((c) => (
                <th key={c.id}>{c.label}</th>
              ))}
              {pCols.map((c) => (
                <th key={c.id}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(candidates ?? []).length === 0 && (
              <tr>
                <td colSpan={1 + kCols.length + pCols.length} className="muted">
                  No candidates in this cohort yet.
                </td>
              </tr>
            )}
            {(candidates ?? []).map((st) => (
              <tr key={st.id}>
                <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{st.full_name ?? st.email}</td>
                {kCols.map((c) => (
                  <td key={c.id}>{cell(st.id, "knowledge", c.id)}</td>
                ))}
                {pCols.map((c) => (
                  <td key={c.id}>{cell(st.id, "performance", c.id)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
