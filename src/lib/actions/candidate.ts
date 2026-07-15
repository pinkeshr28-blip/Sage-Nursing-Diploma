"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyAllAssessors } from "@/lib/email/notify";
import type { ItemSection } from "@/lib/database.types";

export async function uploadItem(
  unitId: string,
  section: ItemSection,
  questionId: string | null,
): Promise<{ error?: string }> {
  const profile = await requireRole("candidate");
  const supabase = await createClient();

  let existingQuery = supabase
    .from("submission_items")
    .select("id")
    .eq("student_id", profile.id)
    .eq("unit_id", unitId)
    .eq("section", section);

  existingQuery = questionId
    ? existingQuery.eq("question_id", questionId)
    : existingQuery.is("question_id", null);

  const { data: existing } = await existingQuery.maybeSingle();

  const patch = {
    status: "uploaded" as const,
    uploaded_at: new Date().toISOString(),
    feedback: null,
  };

  const { error } = existing
    ? await supabase.from("submission_items").update(patch).eq("id", existing.id)
    : await supabase.from("submission_items").insert({
        student_id: profile.id,
        unit_id: unitId,
        section,
        question_id: questionId,
        ...patch,
      });

  if (error) return { error: error.message };

  const { data: unit } = await supabase.from("units").select("title").eq("id", unitId).single();
  let label = section === "preparation" ? "Preparation" : section === "reflection" ? "Reflection" : "?";
  if (questionId) {
    const { data: q } = await supabase
      .from("unit_questions")
      .select("label")
      .eq("id", questionId)
      .single();
    label = q?.label ?? label;
  }

  await notifyAllAssessors({
    fromId: profile.id,
    fromEmail: profile.email,
    subject: `Upload: ${unit?.title ?? "Unit"} — ${label}`,
    body: `${profile.full_name ?? profile.email} has uploaded evidence for ${label} (${
      unit?.title ?? ""
    }) on PebblePad. Please review.`,
    kind: "sage",
  });

  revalidatePath("/candidate/assessments");
  return {};
}
