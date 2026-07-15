import { createClient } from "@/lib/supabase/server";
import { COHORTS } from "@/lib/cohorts";
import { CohortPicker } from "@/components/assessor/CohortPicker";
import { ReviewQueueList, type QueueRow } from "@/components/assessor/ReviewQueueList";

export default async function AssessorQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>;
}) {
  const { cohort } = await searchParams;
  const cohortId = cohort ?? COHORTS[0].id;
  const supabase = await createClient();

  const { data: candidates } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .eq("role", "candidate")
    .eq("cohort_id", cohortId);

  const candidateIds = (candidates ?? []).map((c) => c.id);

  const [{ data: items }, { data: units }, { data: questions }] = await Promise.all([
    candidateIds.length
      ? supabase
          .from("submission_items")
          .select("*")
          .in("student_id", candidateIds)
          .in("status", ["uploaded", "under_review"])
      : Promise.resolve({ data: [] }),
    supabase.from("units").select("id,title"),
    supabase.from("unit_questions").select("id,label"),
  ]);

  const candidateById = new Map((candidates ?? []).map((c) => [c.id, c]));
  const unitById = new Map((units ?? []).map((u) => [u.id, u]));
  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));

  const rows: QueueRow[] = (items ?? []).map((item) => {
    const student = candidateById.get(item.student_id);
    const unit = unitById.get(item.unit_id);
    const label = item.question_id
      ? questionById.get(item.question_id)?.label ?? "?"
      : item.section === "preparation"
        ? "Preparation"
        : "Reflection";

    return {
      itemId: item.id,
      studentName: student?.full_name ?? student?.email ?? "Unknown",
      unitTitle: unit?.title.split(" — ")[0] ?? "Unit",
      label,
      uploadedAt: item.uploaded_at,
    };
  });

  return (
    <>
      <CohortPicker />
      <ReviewQueueList rows={rows} />
    </>
  );
}
