"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/email/notify";

type ActionResult = { error?: string; success?: boolean };

export async function issueDecision(
  itemId: string,
  decision: "pass" | "revision_needed",
  feedback: string,
): Promise<ActionResult> {
  const assessor = await requireRole("assessor");
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("submission_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (!item) return { error: "Item not found." };

  const trimmedFeedback = feedback.trim() || null;

  const { error } = await supabase
    .from("submission_items")
    .update({
      status: decision,
      feedback: trimmedFeedback,
      reviewed_at: new Date().toISOString(),
      reviewed_by: assessor.id,
    })
    .eq("id", itemId);

  if (error) return { error: error.message };

  const [{ data: unit }, { data: student }, { data: question }] = await Promise.all([
    supabase.from("units").select("title").eq("id", item.unit_id).single(),
    supabase.from("profiles").select("id,email,full_name").eq("id", item.student_id).single(),
    item.question_id
      ? supabase.from("unit_questions").select("label").eq("id", item.question_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const label =
    question?.label ?? (item.section === "preparation" ? "Preparation" : "Reflection");
  const verdict = decision === "pass" ? "Feedback issued — passed" : "Revision needed";

  if (student) {
    await sendNotification({
      fromId: assessor.id,
      fromEmail: assessor.email,
      toId: student.id,
      toEmail: student.email,
      subject: `Feedback: ${unit?.title ?? "Unit"} — ${label}`,
      body: `${verdict} for ${label} (${unit?.title ?? ""}).${
        trimmedFeedback ? " Note: " + trimmedFeedback : ""
      } Please log in to PebblePad to review.`,
      kind: decision === "pass" ? "sage" : "coral",
    });
  }

  revalidatePath("/assessor/queue");
  revalidatePath("/assessor/matrix");
  return { success: true };
}

export async function markIqa(studentId: string, unitId: string): Promise<ActionResult> {
  const assessor = await requireRole("assessor");
  const supabase = await createClient();

  const { error } = await supabase.from("iqa_samples").insert({
    student_id: studentId,
    unit_id: unitId,
    done_by: assessor.id,
  });

  if (error) return { error: error.message };

  const [{ data: student }, { data: unit }, { data: admins }] = await Promise.all([
    supabase.from("profiles").select("email,full_name").eq("id", studentId).single(),
    supabase.from("units").select("title").eq("id", unitId).single(),
    supabase.from("profiles").select("id,email").eq("role", "admin"),
  ]);

  await Promise.all(
    (admins ?? []).map((a) =>
      sendNotification({
        fromId: assessor.id,
        fromEmail: assessor.email,
        toId: a.id,
        toEmail: a.email,
        subject: `IQA sampling complete — ${student?.full_name ?? student?.email ?? "Candidate"}`,
        body: `IQA sampling has been completed by ${assessor.full_name ?? assessor.email} for ${
          student?.full_name ?? student?.email ?? "a candidate"
        }, ${unit?.title ?? ""}.`,
        kind: "gold",
      }),
    ),
  );

  revalidatePath("/assessor/iqa");
  return { success: true };
}
