import { createClient } from "@/lib/supabase/server";
import { COHORTS } from "@/lib/cohorts";
import { CohortPicker } from "@/components/assessor/CohortPicker";
import { IqaList, type IqaRow } from "@/components/assessor/IqaList";

export default async function AssessorIqaPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>;
}) {
  const { cohort } = await searchParams;
  const cohortId = cohort ?? COHORTS[0].id;
  const supabase = await createClient();

  const [{ data: candidates }, { data: units }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("role", "candidate")
      .eq("cohort_id", cohortId),
    supabase.from("units").select("id,title").eq("published", true).order("sort_order"),
  ]);

  const candidateIds = (candidates ?? []).map((c) => c.id);
  const { data: samples } = candidateIds.length
    ? await supabase.from("iqa_samples").select("*").in("student_id", candidateIds)
    : { data: [] };

  const sampleMap = new Map((samples ?? []).map((s) => [`${s.student_id}|${s.unit_id}`, s]));

  const rows: IqaRow[] = [];
  (candidates ?? []).forEach((st) => {
    (units ?? []).forEach((u) => {
      const sample = sampleMap.get(`${st.id}|${u.id}`);
      rows.push({
        studentId: st.id,
        unitId: u.id,
        studentName: st.full_name ?? st.email,
        unitTitle: u.title.split(" — ")[0],
        done: !!sample,
        doneAt: sample?.done_at ?? null,
      });
    });
  });

  return (
    <>
      <CohortPicker />
      <IqaList rows={rows} />
    </>
  );
}
