import { createClient } from "@/lib/supabase/server";
import { UnitConfigCard } from "@/components/admin/UnitConfigCard";
import { AddUnitForm } from "@/components/admin/AddUnitForm";

export default async function AdminConfigPage() {
  const supabase = await createClient();

  const { data: units } = await supabase.from("units").select("*").order("sort_order");
  const { data: questions } = await supabase
    .from("unit_questions")
    .select("*")
    .order("sort_order");

  return (
    <>
      <div className="card">
        <h2>Curriculum configuration</h2>
        <p className="muted">
          Edit each unit&apos;s name and its Knowledge Evidence / Performance Evidence
          questions — add, remove, or renumber freely. Candidates and assessors only ever see
          published units.
        </p>
      </div>

      <AddUnitForm />

      {(units ?? []).map((u) => (
        <UnitConfigCard
          key={u.id}
          unitId={u.id}
          title={u.title}
          published={u.published}
          knowledgeQuestions={(questions ?? [])
            .filter((q) => q.unit_id === u.id && q.section === "knowledge")
            .map((q) => ({ id: q.id, label: q.label }))}
          performanceQuestions={(questions ?? [])
            .filter((q) => q.unit_id === u.id && q.section === "performance")
            .map((q) => ({ id: q.id, label: q.label }))}
        />
      ))}
    </>
  );
}
