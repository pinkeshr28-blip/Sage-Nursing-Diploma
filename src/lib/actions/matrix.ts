"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ItemSection, ItemStatus } from "@/lib/database.types";

type ActionResult = { error?: string; success?: boolean };

/**
 * Directly sets a submission item's status — used to backfill work completed before
 * this platform existed. Unlike issueDecision, this never sends a notification: it's a
 * quiet record-keeping tool for admin/assessor, not a live review action.
 */
export async function setItemStatusDirect(
  studentId: string,
  unitId: string,
  section: ItemSection,
  questionId: string | null,
  status: ItemStatus,
): Promise<ActionResult> {
  const profile = await getSessionProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "assessor")) {
    return { error: "Not permitted." };
  }

  const supabase = await createClient();

  let existingQuery = supabase
    .from("submission_items")
    .select("id")
    .eq("student_id", studentId)
    .eq("unit_id", unitId)
    .eq("section", section);

  existingQuery = questionId
    ? existingQuery.eq("question_id", questionId)
    : existingQuery.is("question_id", null);

  const { data: existing } = await existingQuery.maybeSingle();

  const reviewedAt = status === "pass" || status === "revision_needed" ? new Date().toISOString() : null;
  const reviewedBy = status === "pass" || status === "revision_needed" ? profile.id : null;
  const uploadedAt = status === "uploaded" ? new Date().toISOString() : null;

  const { error } = existing
    ? await supabase
        .from("submission_items")
        .update({
          status,
          ...(reviewedAt ? { reviewed_at: reviewedAt, reviewed_by: reviewedBy } : {}),
          ...(uploadedAt ? { uploaded_at: uploadedAt } : {}),
        })
        .eq("id", existing.id)
    : await supabase.from("submission_items").insert({
        student_id: studentId,
        unit_id: unitId,
        section,
        question_id: questionId,
        status,
        reviewed_at: reviewedAt,
        reviewed_by: reviewedBy,
        uploaded_at: uploadedAt,
      });

  if (error) return { error: error.message };

  revalidatePath("/assessor/matrix");
  revalidatePath("/admin/matrix");
  return { success: true };
}
