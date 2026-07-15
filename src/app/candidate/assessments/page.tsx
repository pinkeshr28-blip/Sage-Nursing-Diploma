import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AssessmentsView } from "@/components/candidate/AssessmentsView";

export default async function CandidateAssessmentsPage() {
  const profile = await requireRole("candidate");
  const supabase = await createClient();

  const [{ data: units }, { data: questions }, { data: items }] = await Promise.all([
    supabase.from("units").select("*").eq("published", true).order("sort_order"),
    supabase.from("unit_questions").select("*").order("sort_order"),
    supabase.from("submission_items").select("*").eq("student_id", profile.id),
  ]);

  const unitData = (units ?? []).map((u) => ({
    id: u.id,
    title: u.title,
    knowledgeQuestions: (questions ?? [])
      .filter((q) => q.unit_id === u.id && q.section === "knowledge")
      .map((q) => ({ id: q.id, label: q.label })),
    performanceQuestions: (questions ?? [])
      .filter((q) => q.unit_id === u.id && q.section === "performance")
      .map((q) => ({ id: q.id, label: q.label })),
  }));

  const firstName = (profile.full_name ?? profile.email).split(" ")[0];

  return <AssessmentsView studentFirstName={firstName} units={unitData} items={items ?? []} />;
}
